// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./TokenApproveProxy.sol";
import "./UnxswapRouter.sol";

import "./interfaces/IWETH.sol";
import "./interfaces/IAdapter.sol";
import "./interfaces/IAdapterWithResult.sol";
import "./interfaces/IApproveProxy.sol";
import "./interfaces/IMarketMaker.sol";

/// @title DexRouter
/// @notice Entrance of Split trading in Dex platform
/// @dev Entrance of Split trading in Dex platform
contract DexRouter is UnxswapRouter, OwnableUpgradeable, ReentrancyGuardUpgradeable {
  using UniversalERC20 for IERC20;

  address public approveProxy;

  struct BaseRequest {
    address fromToken;
    address toToken;
    uint256 fromTokenAmount;
    uint256 minReturnAmount;
    uint256 deadLine;
    address pmmAdapter;
  }

  struct SwapRequest {
    address fromToken;
    uint256[] fromTokenAmount;
  }

  struct RouterPath {
    address[] mixAdapters;
    address[] assetTo;
    uint256[] weight;
    bytes[] extraData;
  }

  function initialize() public initializer {
    __Ownable_init();
    __ReentrancyGuard_init();
  }

  //-------------------------------
  //------- Events ----------------
  //-------------------------------

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

  function _exeForks(
    uint256 layerAmount,
    SwapRequest calldata request,
    RouterPath calldata path,
    bool isFirstHop
  ) internal {
    uint256 bal = IERC20(request.fromToken).universalBalanceOf(address(this));
    // execute multiple Adapters for a transaction pair
    for (uint256 i = 0; i < path.mixAdapters.length; i++) {
      bytes32 rawData = bytes32(path.weight[i]);
      address poolAddress;
      bool reserves;
      uint256 weight;
      assembly {
        poolAddress := and(rawData, _ADDRESS_MASK)
        reserves := and(rawData, _REVERSE_MASK)
        weight := shr(160, and(rawData, _WEIGHT_MASK))
      }
      require(weight >= 0 && weight <= 10000, "weight out of range");
      uint256 _fromTokenAmount;
      if (isFirstHop) {
        _fromTokenAmount = (layerAmount * weight) / 10000;
      } else {
        if (i == path.mixAdapters.length - 1) {
          // There will be one drop left over from the last fork in percentage, fix it here
          _fromTokenAmount = IERC20(request.fromToken).universalBalanceOf(address(this));
        } else {
          _fromTokenAmount = (bal * weight) / 10000;
        }
      }
      address tokenApprove = IApproveProxy(approveProxy).tokenApprove();
      SafeERC20.safeApprove(IERC20(request.fromToken), tokenApprove, _fromTokenAmount);
      // send the asset to the adapter
      _deposit(address(this), path.assetTo[i], request.fromToken, _fromTokenAmount);
      if (reserves) {
        IAdapter(path.mixAdapters[i]).sellBase(address(this), poolAddress, path.extraData[i]);
      } else {
        IAdapter(path.mixAdapters[i]).sellQuote(address(this), poolAddress, path.extraData[i]);
      }
      SafeERC20.safeApprove(IERC20(request.fromToken), tokenApprove, 0);
    }
  }

  function _exeHop(
    address pmmAdapter,
    uint256 layerAmount,
    SwapRequest[] calldata request,
    RouterPath[] calldata layer,
    IMarketMaker.PMMSwapRequest[] calldata pmmRequest,
    bytes[] calldata pmmSignature
  ) internal {
    // 1. try to replace this hop by pmm
    if (_tryPmmSwap(pmmAdapter, address(this), layerAmount, pmmRequest[0], pmmSignature[0])==0) {
        return;
    }

    // 2. if this hop is a single swap
    if (layer.length == 1) {
      _exeForks(layerAmount, request[0], layer[0], true);
      return;
    }

    // 3. execute forks
    for (uint256 i = 0; i < layer.length; i++) {
      if (i > 0) {
        layerAmount = IERC20(pmmRequest[i + 1].fromToken).universalBalanceOf(address(this));
      }

      // 3.1 try to replace this fork by pmm
      if(_tryPmmSwap(pmmAdapter, address(this), layerAmount, pmmRequest[i+1], pmmSignature[i+1])==0) {
        continue;
      }

      // 3.2 execute forks
      _exeForks(layerAmount, request[i], layer[i], i == 0);
    }
  }

  function _deposit(
    address from,
    address to,
    address token,
    uint256 amount
  ) internal {
    if (UniversalERC20.isETH(IERC20(token))) {
      if (amount > 0) {
        IWETH(address(uint160(_WETH))).deposit{ value: amount }();
        if (to != address(this)) {
          SafeERC20.safeTransfer(IERC20(address(uint160(_WETH))), to, amount);
        }
      }
    } else {
      IApproveProxy(approveProxy).claimTokens(token, from, to, amount);
    }
  }

  function _transferChips(BaseRequest memory baseRequest) internal {
    _transferTokenToUser(baseRequest.fromToken);
    _transferTokenToUser(baseRequest.toToken);
  }

  function _transferTokenToUser(address token) internal {
    if ((IERC20(token).isETH())) {
      uint256 wethBal = IERC20(address(uint160(_WETH))).balanceOf(address(this));
      if (wethBal > 0) {
        IWETH(address(uint160(_WETH))).withdraw(wethBal);
      }
      uint256 ethBal = (address(this).balance);
      if (ethBal > 0) {
        payable(msg.sender).transfer(ethBal);
      }
    } else {
      uint256 bal = IERC20(token).balanceOf(address(this));
      if (bal > 0) {
        SafeERC20.safeTransfer(IERC20(token), msg.sender, bal);
      }
    }
  }

  function _tryPmmSwap(
    address pmmAdapter,
    address to,
    uint256 actualRequest,
    IMarketMaker.PMMSwapRequest memory pmmRequest,
    bytes memory signature
  ) internal returns (uint256) {
    if (pmmRequest.fromTokenAmountMax >= actualRequest) {
      bytes memory moreInfo = abi.encode(
        actualRequest,
        pmmRequest,
        signature
      );

      uint256 errorCode = IAdapterWithResult(pmmAdapter).sellBase(to, address(0), moreInfo);
      if (errorCode == 0){
        // transfer user's assets to maker
        SafeERC20.safeTransfer(IERC20(pmmRequest.fromToken), pmmRequest.payer, actualRequest);
      }
      return errorCode;
    }
    return uint256(IMarketMaker.ERROR.REQUEST_TOO_MUCH);
  }

  function _checkReturnAmountAndEmitEvent(
    uint256 toTokenOriginBalance,
    address sender,
    BaseRequest memory baseRequest
  ) internal returns (uint256 returnAmount) {
    returnAmount = IERC20(baseRequest.toToken).universalBalanceOf(sender) - toTokenOriginBalance;
    require(returnAmount >= baseRequest.minReturnAmount, "Route: Return amount is not enough");
    emit OrderRecord(baseRequest.fromToken, baseRequest.toToken, sender, baseRequest.fromTokenAmount, returnAmount);
  }

  //-------------------------------
  //------- Admin functions -------
  //-------------------------------

  function setApproveProxy(address newApproveProxy) external onlyOwner {
    approveProxy = newApproveProxy;
  }

  //-------------------------------
  //------- Users Functions -------
  //-------------------------------

  function smartSwap(
    BaseRequest calldata baseRequest,
    uint256[] calldata batchAmount,
    SwapRequest[][] calldata requests,
    RouterPath[][] calldata layers,
    IMarketMaker.PMMSwapRequest[][] calldata pmmRequests,
    bytes[][] calldata pmmSignatures
  ) external payable isExpired(baseRequest.deadLine) nonReentrant returns (uint256 returnAmount) {
    // 1. transfer from token in
    require(baseRequest.fromTokenAmount > 0, "Route: fromTokenAmount must be > 0");
    BaseRequest memory localBaseRequest = baseRequest;
    returnAmount = IERC20(baseRequest.toToken).universalBalanceOf(msg.sender);
    _deposit(msg.sender, address(this), localBaseRequest.fromToken, localBaseRequest.fromTokenAmount);

    // 2. check total batch amount, invoid stack too deep
    {    
      uint256 totalBatchAmount = 0;
      for (uint256 i = 0; i < layers.length; i++) {
        totalBatchAmount += batchAmount[i];
      }
      require(
        totalBatchAmount <= localBaseRequest.fromTokenAmount,
        "Route: number of branches should be <= fromTokenAmount"
      );
    }

    // 3. try to replace the whole swap by pmm
    if (_tryPmmSwap(
      localBaseRequest.pmmAdapter,
      msg.sender,
      localBaseRequest.fromTokenAmount, 
      pmmRequests[0][0],
      pmmSignatures[0][0]
    )==0) {
      // 3.1 transfer chips to user
      _transferTokenToUser(localBaseRequest.fromToken);
      returnAmount = _checkReturnAmountAndEmitEvent(returnAmount, msg.sender, localBaseRequest);

      return returnAmount;
    }

    // 4. the situation that the whole swap is a single swap
    if (layers.length == 1 && layers[0].length == 1) {
      // 4.1 excute fork
      _exeForks(baseRequest.fromTokenAmount, requests[0][0], layers[0][0], true);

      // 4.2 transfer chips
      _transferChips(baseRequest);

      // 4.3 check minReturnAmount
      returnAmount = _checkReturnAmountAndEmitEvent(returnAmount, msg.sender, localBaseRequest);

      return returnAmount;
    }

    // 5. execute batch
    for (uint256 i = 0; i < layers.length; i++) {
      uint256 layerAmount = batchAmount[i];
      // execute hop
      _exeHop(localBaseRequest.pmmAdapter,layerAmount, requests[i], layers[i], pmmRequests[i + 1], pmmSignatures[i + 1]);
    }

    // 6. transfer tokens to user
    _transferChips(baseRequest);

    // 7. check minReturnAmount
    returnAmount = _checkReturnAmountAndEmitEvent(returnAmount, msg.sender, localBaseRequest);
  }
}
