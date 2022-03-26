// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IAdapter.sol";
import "../interfaces/ICurveV2.sol";
import "../interfaces/IERC20.sol";
import "../libraries/UniversalERC20.sol";
import "../libraries/SafeERC20.sol";
import "hardhat/console.sol";


// for two tokens
contract CurveV2Adapter is IAdapter {

    function _curveSwap(address to, address pool, bytes memory moreInfo) internal {
        (address fromToken, address toToken, uint256 i, uint256 j, bool use_eth) = abi.decode(moreInfo, (address, address, uint256, uint256, bool));
        uint256 sellAmount = IERC20(fromToken).balanceOf(address(this));

        console.log("i: %s, j: %s, sellAmount: %s", i, j, sellAmount);

        // // approve
        SafeERC20.safeApprove(IERC20(fromToken),  pool, sellAmount);
        // // swap
        ICurveV2(pool).exchange(i, j, sellAmount, 0, use_eth);
        
        if(to != address(this)) {
            SafeERC20.safeTransfer(IERC20(toToken), to, IERC20(toToken).balanceOf(address(this)));
        }
    }

    function sellBase(address to, address pool, bytes memory moreInfo) external override {
        _curveSwap(to, pool, moreInfo);
    }

    function sellQuote(address to, address pool, bytes memory moreInfo) external override {
        _curveSwap(to, pool, moreInfo);
    }

    event Received(address, uint);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}