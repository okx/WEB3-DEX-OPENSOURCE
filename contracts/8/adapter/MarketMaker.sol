// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

import "../libraries/SafeERC20.sol";
import "../interfaces/IApproveProxy.sol";

/// @title MarketMaker
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra detailsq
contract MarketMaker is Ownable, EIP712("METAX PMM Adapter", "1.0") {
    using SafeERC20 for IERC20;
    // ============ Storage ============
    // keccak256("PMMSwapRequest(address payer,address fromToken,address toToken,uint256 fromTokenAmount,uint256 toTokenAmount,uint256 salt,uint256 deadLine,bool isPushOrder)")
    bytes32 private constant _ORDER_TYPEHASH = 0x4a40b70e4ae0155dd898ee90c3175d87bc1fa4f090f96b782f2cfc670bc98f8c;
            
//    uint256 private constant UINT_128_MASK = (1 << 128) - 1;
//    uint256 private constant UINT_64_MASK = (1 << 64) - 1;
    uint256 private constant ADDRESS_MASK = (1 << 160) - 1;         
    uint256 private constant VALID_PERIOD_MIN = 3600;
    address constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address immutable WETH;

    mapping(address => address) public operator;
    mapping(bytes32 => OrderStatus) public orderStatus;
    address public approveProxy;
    address public router;
    address public feeTo;
    uint256 public feeRate;

    enum ERROR{
        NO_ERROR,
        INVALID_SIGNATURE,
        QUOTE_EXPIRED,
        REQUEST_TOO_MUCH,
        ORDER_CANCELLED_OR_FINALIZED,
        REMAINING_AMOUNT_NOT_ENOUGH,
        FAIL_TO_CLAIM_TOKEN
    }


    // ============ Struct ============

    struct PMMSwapRequest {
        uint256 pathIndex;
        address payer;
        address fromToken;
        address toToken;
        uint256 fromTokenAmountMax;
        uint256 toTokenAmountMax;
        uint256 salt;
        uint256 deadLine;
        bool    isPushOrder;
    }

    struct OrderStatus{
        uint256 fromTokenAmountMax;
        uint256 fromTokenAmountUsed;
        bool cancelledOrFinalized;
    }

    // ============ Event ============

    event ChangeRouter(address indexed sender, address newRouter);
    event ChangeFeeConfig(address indexed sender, address newFeeTo, uint256 newFeeRate);
    event ChangeOperator(address indexed payer, address operator);
    event CancelOrder(address indexed sender, bytes32 orderHash);
    event Swap(address indexed payer, address fromToken, address toToken, uint256 fromAmount, uint256 toAmount);


    constructor (                               
        address _weth,
        address _router,
        address _feeTo,
        uint256 _feeRate
    ) {
        require(_weth !=  address(0), "Wrong Address!");
        require(_router !=  address(0), "Wrong Address!");
        require(_feeTo != address(0), "Wrong Address!");
        require(_feeRate <= 100, 'fee Rate cannot exceed 1%');
        require(_ORDER_TYPEHASH == keccak256("PMMSwapRequest(address payer,address fromToken,address toToken,uint256 fromTokenAmount,uint256 toTokenAmount,uint256 salt,uint256 deadLine,bool isPushOrder)"), "Wrong _ORDER_TYPEHASH");
        WETH = _weth;
        router = _router;
        feeTo = _feeTo;
        feeRate = _feeRate;
    }

    // ============ Modifier ============

    modifier onlyRouter() {
        require(msg.sender == router, "OR!");
        _;
    }

    // ============ OnlyOwner ============

    function changeRouter(address _router) external onlyOwner {
        require(_router !=  address(0), "Wrong Address!");
        router = _router;

        emit ChangeRouter(msg.sender, _router);

    }

    function feeConfig(address _feeTo, uint256 _feeRate) external onlyOwner {       
        require(_feeTo != address(0), "Wrong Address!");
        require(_feeRate <= 100, 'fee Rate cannot exceed 1%');
        feeTo = _feeTo;
        feeRate = _feeRate;

        emit ChangeFeeConfig(msg.sender, feeTo, feeRate);

    }

    function setApproveProxy(address newApproveProxy) external onlyOwner {
        approveProxy = newApproveProxy;
    }

    // ============ External ============

    function setOperator(address _operator) external {          
        operator[msg.sender] = _operator;
        emit ChangeOperator(msg.sender, _operator);

    }

    function cancelQuotes(PMMSwapRequest[] memory request, bytes[] memory signature) external returns(bool[] memory) {
        require(request.length == signature.length, "PMM Adapter: length not match");
        bool[] memory result = new bool[] (request.length);
        for (uint256 i = 0; i < request.length; i++){
            if (block.timestamp < request[i].salt + VALID_PERIOD_MIN){
                continue;
            }
            bytes32 digest = _hashTypedDataV4(hashOrder(request[i]));
            if (validateSig(digest, msg.sender, signature[i])) {
                orderStatus[digest].cancelledOrFinalized = true;
                emit CancelOrder(msg.sender, digest);
                result[i] = true;
            }
        }
        return result;
    }

    function queryOrderStatus(bytes32[] calldata digests) external view returns (OrderStatus[] memory){
        uint256 len = digests.length;
        OrderStatus[] memory status = new OrderStatus[](len);
        for (uint256 i = 0; i < len; i++){
            status[i] = (orderStatus[digests[i]]);
        }
        return status;
    }

    function getDomainSeparator() external view returns (bytes32){
      return _domainSeparatorV4();
    }

    // reentrancy locked in dex router
    function swap(
        address to,    
        uint256 actualAmountRequest,                   
        PMMSwapRequest memory request,
        bytes memory signature
    ) external onlyRouter returns(uint256) { // TODO After this, Router transfer fromTokenAmount to payer

        bytes32 digest = _hashTypedDataV4(hashOrder(request));

        if (!validateSig(digest, request.payer, signature)) {
            return uint256(ERROR.INVALID_SIGNATURE);
        }
        uint256 errorCode = updateOrder(digest, actualAmountRequest, request);
        if (errorCode > 0){
            return errorCode;
        }

        // get transfer Amount and Token Address  
        uint256 amount = actualAmountRequest * request.toTokenAmountMax / request.fromTokenAmountMax;
        IERC20 token = IERC20(request.toToken);
        if (request.toToken == ETH_ADDRESS) {       
            token = IERC20(WETH);
        }
        
        // transfer maker's funds to "to"
        try IApproveProxy(approveProxy).claimTokens(address(token), request.payer, address(this), amount) {
            if (feeTo != address(0) && feeRate != 0) {
                uint256 fee = amount * feeRate / 10000;
                token.safeTransfer(feeTo, fee);
                amount -= fee;
            }
            token.safeTransfer(to, amount);                         

            emit Swap(request.payer, request.fromToken, request.toToken, actualAmountRequest, amount);

            return uint256(ERROR.NO_ERROR);
        } catch {
            return uint256(ERROR.FAIL_TO_CLAIM_TOKEN);
        }

    }
    

    // ============ Internal ============

    /// @dev Get the struct hash of a PMMSwapRequest.
    /// @param order The SwapRequest.
    /// @return structHash The struct hash of the order.
    function hashOrder(PMMSwapRequest memory order)
        internal
        pure
        returns (bytes32 structHash)
    {
        // The struct hash is:
        // keccak256(abi.encode(
        //   _ORDER_TYPEHASH,
        //   order.payer,
        //   order.fromToken,
        //   order.toToken,
        //   order.fromTokenAmount,
        //   order.toTokenAmount,
        //   order.salt,
        //   order.deadLine,
        //   order.isPushOrder
        // ))
        assembly {
            let mem := mload(0x40)
            mstore(mem, _ORDER_TYPEHASH)
            // order.payer;
            mstore(add(mem, 0x20), and(ADDRESS_MASK, mload(order)))
            // order.fromToken;
            mstore(add(mem, 0x40), and(ADDRESS_MASK, mload(add(order, 0x20))))
            // order.toToken;
            mstore(add(mem, 0x60), and(ADDRESS_MASK, mload(add(order, 0x40))))
            // order.fromTokenAmount;
            mstore(add(mem, 0x80), mload(add(order, 0x60)))
            // order.toTokenAmount;
            mstore(add(mem, 0xA0), mload(add(order, 0x80)))
            // order.salt;
            mstore(add(mem, 0xC0), mload(add(order, 0xA0)))
            // order.deadLine;
            mstore(add(mem, 0xE0), mload(add(order, 0xC0)))
            // order.isPushOrder;
            mstore(add(mem, 0x100), mload(add(order, 0xE0)))

            structHash := keccak256(mem, 0x120)
        }
    }

    function validateSig(
        bytes32 digest,
        address payer,
        bytes memory signature
    ) internal view returns (bool) {
        address signatureAddress = ECDSA.recover(digest, signature);
        if (signatureAddress == payer || signatureAddress == operator[payer]) {
            return true;
        }
        return false;
    }

    function updateOrder(
        bytes32 digest, 
        uint256 actualAmountRequest,
        PMMSwapRequest memory order
    ) internal returns (uint256) {
        if (order.deadLine < block.timestamp) {     
            return uint256(ERROR.QUOTE_EXPIRED);
        }

        if (actualAmountRequest > order.fromTokenAmountMax){
            return uint256(ERROR.REQUEST_TOO_MUCH);
        }

        OrderStatus storage status = orderStatus[digest];
        // in case of canceled or finalized order
        if (status.cancelledOrFinalized) {
            return uint256(ERROR.ORDER_CANCELLED_OR_FINALIZED);
        }

        // in case of pull order
        if (!order.isPushOrder) {
            status.cancelledOrFinalized = true;
            return uint256(ERROR.NO_ERROR);
        }

        // in case of push order
        if (order.fromTokenAmountMax > 0 && status.fromTokenAmountMax == 0 ) {
            // init push order
            status.fromTokenAmountMax = order.fromTokenAmountMax;
        }
        if (status.fromTokenAmountUsed + actualAmountRequest > order.fromTokenAmountMax){
            return uint256(ERROR.REMAINING_AMOUNT_NOT_ENOUGH);
        }
        status.fromTokenAmountUsed += actualAmountRequest;
        
        return uint256(ERROR.NO_ERROR);
    }

}
