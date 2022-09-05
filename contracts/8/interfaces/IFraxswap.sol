/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

interface IFraxswap {
    function fee() external view returns (uint256);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function getAmountOut(uint amountIn, address tokenIn) external view returns (uint);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}
