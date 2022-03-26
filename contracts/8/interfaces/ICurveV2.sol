// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

interface ICurveV2 {
    // solium-disable-next-line mixedcase
    function exchange(uint256 i, uint256 j, uint256 dx, uint256 minDy, bool use_eth) external;

}