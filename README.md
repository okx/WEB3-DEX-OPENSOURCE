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

# Contributing

There are several ways you can contribute to the SOR SmartContract project:

## Ways to Contribute

### Join Community Discussions
Join our [Discord community](https://discord.gg/3N9PHeNn) to help other developers troubleshoot their integration issues and share your experience with the SOR SmartContract. Our Discord is the main hub for technical discussions, questions, and real-time support.

### Open an Issue
- Open [issues](https://github.com/okx/WEB3-DEX-OPENSOURCE/issues) to suggest features or report minor bugs
- Before opening a new issue, search existing issues to avoid duplicates
- When requesting features, include details about use cases and potential impact

### Submit Pull Requests
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
```sh
npx hardhat test
```
5. Submit a pull request

### Pull Request Guidelines
- Discuss non-trivial changes in an issue first
- Include tests for new functionality
- Update documentation as needed
- Add a changelog entry describing your changes in the PR
- PRs should be focused and preferably address a single concern

## Bug Bounty
Help us enhance the security of the SOR SmartContract by participating in our bug bounty program. Report vulnerabilities and earn rewards! Learn more and get started at [HackerOne](https://hackerone.com/okg/policy_scopes?type=team).

## First Time Contributors
- Look for issues labeled "good first issue"
- Read through our documentation
- Set up your local development environment following the Installation guide

## Code Review Process
1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Questions?
- Open a discussion [issue](https://github.com/okx/WEB3-DEX-OPENSOURCE/issues) for general questions
- Join our [community](https://discord.gg/3N9PHeNn) for real-time discussions
- Review existing issues and discussions

Thank you for contributing to the SOR SmartContract repo!
