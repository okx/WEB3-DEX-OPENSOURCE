# SOR SmartContract

## Overview

The SOR (Smart Order Router) SmartContract repository contains the implementation of a decentralized exchange (DEX) router. This router facilitates split trading on the Dex platform, allowing users to swap tokens efficiently using various strategies and protocols. The primary contract in this repository is `DexRouter`, which integrates multiple functionalities and libraries to provide a comprehensive trading solution.

## Repository Structure

- `contracts/8/DexRouter.sol`: Main contract for the DexRouter, handling split trading.
- `contracts/8/UnxswapV3Router.sol`: Contract for handling Uniswap V3 swaps.
- `contracts/8/UnxswapV2Router.sol`: Contract for handling Uniswap V2 swaps.
- `contracts/8/interfaces/`: Directory containing interface definitions.
- `contracts/8/libraries/`: Directory containing various utility libraries.
- `contracts/8/storage/`: Directory containing storage contracts.
- `contracts/8/adapters/`: Directory containing adapter contracts for integrating with different protocols.
## Key Features

- **Split Trading**: The DexRouter allows for split trading, enabling users to execute trades across multiple liquidity sources.
- **Uniswap V3 Integration**: The UnxswapV3Router contract provides integration with Uniswap V3 for efficient token swaps.
- **Uniswap V2 Integration**: The UnxswapV2Router contract provides integration with Uniswap V2 for efficient token swaps.
- **Security**: The contracts has been audited by okx innter audit team.
- **Utility Libraries**: Various utility libraries are included to facilitate common tasks such as token transfers, ETH wrapping, and more.

## Installation

To use the contracts in this repository, you need to have the following prerequisites:

- Node.js and npm (or yarn)
- Hardhat (for development and testing)

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/okx/WEB3-DEX-OPENSOURCE.git
   cd WEB3-DEX-OPENSOURCE
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

3. Compile the contracts:
   ```sh
   npx hardhat compile
   ```

4. Run tests:
   ```sh
   npx hardhat test
   ```


