const { ethers } = require("hardhat");
require("../../tools");
const axios = require("axios")
const { getConfig } = require("../../config");
tokenConfig = getConfig("eth");
require('dotenv').config();
let { initDexRouter, direction, FOREVER } = require("./utils")
const balancerVault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

async function deployContract() {
    BalancerV2ComposableAdapter = await ethers.getContractFactory("BalancerV2ComposableAdapter");
    BalancerV2ComposableAdapter = await BalancerV2ComposableAdapter.deploy(balancerVault);
    await BalancerV2ComposableAdapter.deployed();
    return BalancerV2ComposableAdapter
}

// 这里每次修改路径，都要修改moreInfo
async function getMoreInfo(fromAmount) {
    const hipNumber = 2

    hipDetails =  ethers.utils.defaultAbiCoder.encode(
        [ "tuple(bytes32, address, address)", "tuple(bytes32, address, address)" ]  ,
        [
            [
                "0xe0fcbf4d98f0ad982db260f86cf28b49845403c5000000000000000000000504", // wstETH-bb-a-WETH
                "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
                "0x60D604890feaa0b5460B28A424407c24fe89374a"
            ],
            [
                "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc", 
                "0x60D604890feaa0b5460B28A424407c24fe89374a", // bb-a-WETH
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // weth
            ],
        ]
      )



    moreInfo =  ethers.utils.defaultAbiCoder.encode(
        ["uint8",  "bytes" ], 
        [
            hipNumber,
            hipDetails
        ]
    )
    return moreInfo
}



async function aaveLinearPool(BalancerV2ComposableAdapter) {
    const pmmReq = []
    const accountAddress = "0x0c67f4FfC902140C972eCAb356c9993e6cE8caF3";
    await startMockAccount([accountAddress]);
    const account = await ethers.getSigner(accountAddress);

    // set account balance 0.6 eth
    await setBalance(accountAddress, "0x53444835ec580000");

    fromToken = await ethers.getContractAt(
        "MockERC20",
        "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
    )
    toToken = await ethers.getContractAt(
        "MockERC20",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    )

    const fromTokenAmount = ethers.utils.parseUnits("1", 18);
    const { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WETH.baseTokenAddress);

    const minReturnAmount = 0;
    const deadLine = FOREVER;
    const balancerV2PoolAddr = balancerVault; 
    console.log("before fromToken Balance: " + await fromToken.balanceOf(account.address));
    console.log("before toToken Balance: " + await toToken.balanceOf(account.address));

    // node1
    // const requestParam1 = [
    //     tokenConfig.tokens.WETH.baseTokenAddress,
    //     [fromTokenAmount]
    // ];
    const mixAdapter1 = [
        BalancerV2ComposableAdapter.address
    ];
    const assertTo1 = [
        BalancerV2ComposableAdapter.address
    ];
    const weight1 = Number(10000).toString(16).replace('0x', '');
    const rawData1 = [
        "0x" +
        direction(fromToken.address, toToken.address) +
        "0000000000000000000" +
        weight1 +
        balancerV2PoolAddr.replace("0x", "") 
    ];
    const moreInfo = await getMoreInfo()
    const extraData1 = [moreInfo];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, fromToken.address];

    const orderId = 0;

    // layer1
    // const request1 = [requestParam1];
    const layer1 = [router1];

    const baseRequest = [
        fromToken.address,
        toToken.address,
        fromTokenAmount,
        minReturnAmount,
        deadLine,
    ]
    await fromToken.connect(account).approve(tokenApprove.address, fromTokenAmount);
    await dexRouter.connect(account).smartSwapByOrderId(
        orderId,
        baseRequest,
        [fromTokenAmount],
        [layer1],
        pmmReq
    );

    console.log("after fromToken Balance: " + await fromToken.balanceOf(account.address));
    console.log("after toToken Balance: " + await toToken.balanceOf(account.address));
    console.log("input amount: ", fromTokenAmount);
}


async function main() {
    BalancerV2ComposableAdapter = await deployContract();
    await aaveLinearPool(BalancerV2ComposableAdapter);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });