require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-solhint");
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("@openzeppelin/hardhat-upgrades");
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const BSC_API_KEY = process.env.BSC_API_KEY || '';
const OKC_API_KEY = process.env.OKC_API_KEY || '';

module.exports = {
  solidity: {
    compilers: [
			{
				version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
			},
      {
				version: '0.8.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
			},
      {
				version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
			},
      {
				version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
			},
		]
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      forking:
      {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
      }
    },
    okc: {
      url: "https://exchainrpc.okex.org",
      chainId: 66,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    okc_test: {
      url: "https://exchaintestrpc.okex.org",
      chainId: 65,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    bsc: {
      url: "https://bsc-dataseed1.defibit.io",
      chainId: 56,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    bsc_test: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    eth: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    },
    cronosmain: {
      url: "https://evm-cronos.crypto.org",
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    cronostest: {
      url: "https://cronos-testnet-3.crypto.org:8545",
      accounts: [`${PRIVATE_KEY}`],
      network_id: "*",
      skipDryRun: true,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    avax: {
      url: "https://rpc.ankr.com/avalanche",
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    avaxtest: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [`${PRIVATE_KEY}`],
      gas: 2100000,
      gasPrice: 25000000000,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    polygon: {
      url: "https://rpc.ankr.com/polygon",
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    },
    polygontest: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: [`${PRIVATE_KEY}`],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      },
    }
  },
  paths: {
    sources: './contracts/8'
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  gasReporter: {
    enabled: false
  },
  mocha: {
    timeout: 180000000
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      bsc: BSC_API_KEY,
      okc: OKC_API_KEY
    }
  }
}
