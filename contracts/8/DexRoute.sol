// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./TokenApproveProxy.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IAdapter.sol";

import "./libraries/SafeMath.sol";
import "./libraries/UniversalERC20.sol";
import "./libraries/SafeERC20.sol";


/// @title DexRoute
/// @author The name of the author
/// @notice Entrance of Split trading in Dex platform
/// @dev Entrance of Split trading in Dex platform
contract DexRoute is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;
    using UniversalERC20 for IERC20;

    address constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public WETH;
    address public approveProxy;
    address public tokenApprove;

    uint256 private toTokenOriginBalance;

    struct SwapRequest {
        address[] fromToken;
        address[] toToken;
        uint256[] fromTokenAmount;
    }

    struct RouterPath {
        address[][] mixAdapters;
        address[][] mixPairs;
        address[][] assetTo;
        uint256[][] weight;
        uint256[][] directions;
        bytes[][] extraData;
    }

    receive() external payable {}

    function initialize(address payable _weth) public initializer {
        __Ownable_init();
        WETH = _weth;
    }

    //-------------------------------
    //------- Events ----------------
    //-------------------------------

    event OrderRecord(address fromToken, address toToken, address sender, uint256 fromAmount, uint256 returnAmount);

    //-------------------------------
    //------- Modifier --------------
    //-------------------------------

    modifier isExpired(uint256 deadLine) {
        require(deadLine >= block.timestamp, "Route: expired");
        _;
    }

    //-------------------------------
    //------- Internal Functions ----
    //-------------------------------

    function _exeSwap(
        SwapRequest calldata request,
        RouterPath calldata path,
        bool isRelay
    )
        internal
    {
        uint256 preForkAmount = IERC20(request.fromToken[0]).universalBalanceOf(address(this));
        for (uint256 i = 0; i < path.mixAdapters.length; i++) {
            for (uint256 j = 0; j < path.mixAdapters[i].length; j++) {
                uint256 _fromTokenAmount = 0;
                if (isRelay) {
                    _fromTokenAmount = preForkAmount.mul(path.weight[i][j]).div(10000); 
                } else {
                    _fromTokenAmount = request.fromTokenAmount[i];
                }
                SafeERC20.safeApprove(IERC20(request.fromToken[j]), tokenApprove, _fromTokenAmount);
                // Send the asset to adapter
                _deposit(address(this), path.assetTo[i][j], request.fromToken[j], _fromTokenAmount, request.fromToken[j] == ETH_ADDRESS);
                if (path.directions[i][j] == 1) {
                    IAdapter(path.mixAdapters[i][j]).sellBase(address(this), path.mixPairs[i][j], path.extraData[i][j]);
                } else {
                    IAdapter(path.mixAdapters[i][j]).sellQuote(address(this), path.mixPairs[i][j], path.extraData[i][j]);
                }
                SafeERC20.safeApprove(IERC20(request.fromToken[j]), tokenApprove, 0);
            }
        }
    }

    function _mixSwap(
        SwapRequest[] calldata request,
        RouterPath[] calldata layer
    )
        internal
    {
        for (uint256 i = 0; i < layer.length; i++) {
            require(layer[i].mixPairs.length > 0, "Route: pairs empty");
            require(layer[i].mixPairs.length == layer[i].mixAdapters.length, "Route: pair adapter not match");
            for (uint256 j = 0; j < layer[i].mixPairs.length; j++) {
                require(layer[i].mixPairs[j].length == layer[i].assetTo[j].length - 1, "Route: pair assetto not match");
            }
            require(layer[i].weight.length == layer[i].mixPairs.length, "Route: weight not match");
          
            _exeSwap(request[i], layer[i], i != 0);
        }
    }

    function _deposit(
        address _from,
        address _to,
        address _token,
        uint256 _amount,
        bool _isGasToken
    )
        internal
    {
        if (_isGasToken) {
            if (_amount > 0) {
                IWETH(WETH).deposit{value: _amount}();
                if (_to != address(this)) { 
                    SafeERC20.safeTransfer(IERC20(WETH), _to, _amount); 
                }
            }
        } else {
            IApproveProxy(approveProxy).claimTokens(_token, _from, _to, _amount);
        }
    }

    //-------------------------------
    //------- Admin functions -------
    //-------------------------------

    function setApproveProxy(address _approveProxy) external onlyOwner {
        approveProxy = _approveProxy;
    }

    function setTokenAprrove(address _tokenApprove) external onlyOwner {
        tokenApprove = _tokenApprove;
    }

    //-------------------------------
    //------- Users Functions -------
    //-------------------------------

    function smartSwap(
        address fromToken,
        address toToken,
        uint256 fromTokenAmount,
        uint256 minReturnAmount,
        uint256 deadLine,
        SwapRequest[][] calldata request,
        RouterPath[][] calldata layers
    )
        external payable isExpired(deadLine) nonReentrant returns (uint256 returnAmount) 
    {
        address tmpFromToken = fromToken;
        toTokenOriginBalance = IERC20(toToken).universalBalanceOf(msg.sender);
        _deposit(msg.sender, address(this), tmpFromToken, fromTokenAmount, tmpFromToken == ETH_ADDRESS);
        
        for (uint256 i = 0; i < layers.length; i++) {
            _mixSwap(request[i], layers[i]);
        }
        
        if(toToken == ETH_ADDRESS) {
            uint256 remainAmount = IERC20(tmpFromToken).universalBalanceOf(address(this));
            IWETH(WETH).withdraw(remainAmount);
            payable(msg.sender).transfer(remainAmount);
            if (IERC20(tmpFromToken).universalBalanceOf(address(this)) > 0) {
                SafeERC20.safeTransfer(IERC20(tmpFromToken), msg.sender, IERC20(tmpFromToken).universalBalanceOf(address(this)));
            }
        } else {
            if (tmpFromToken == ETH_ADDRESS) {
                uint256 gasFromAmount = IERC20(tmpFromToken).universalBalanceOf(address(this));
                IWETH(WETH).withdraw(gasFromAmount);
                payable(msg.sender).transfer(gasFromAmount);
            } else {
                if (IERC20(tmpFromToken).universalBalanceOf(address(this)) > 0) {
                    SafeERC20.safeTransfer(IERC20(tmpFromToken), msg.sender, IERC20(tmpFromToken).universalBalanceOf(address(this)));
                }
            }
            SafeERC20.safeTransfer(IERC20(toToken), msg.sender, IERC20(toToken).universalBalanceOf(address(this)));
        }

        returnAmount = IERC20(toToken).universalBalanceOf(msg.sender).sub(toTokenOriginBalance);

        require(returnAmount >= minReturnAmount, "Route: Return amount is not enough");

        toTokenOriginBalance = 0;
        emit OrderRecord(fromToken, toToken, msg.sender, fromTokenAmount, returnAmount);
    }
}