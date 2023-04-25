const { assert } = require("chai");
const { ethers } = require("hardhat");
require("../../tools");
const { getConfig } = require("../../config");
const { initDexRouter, direction, FOREVER, packRawData} = require("./utils")
tokenConfig = getConfig("bsc");


async function executeBase2Quote() {
    const pmmReq = []
    // Network bsc
    await setForkNetWorkAndBlockNumber('bsc',27621131);


    const accountAddress = "0x358506b4C5c441873AdE429c5A2BE777578E2C6f";
    await startMockAccount([accountAddress]);
    const account = await ethers.getSigner(accountAddress);

    Base = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.USDT.baseTokenAddress
    )
    Quote = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.DAI.baseTokenAddress
    )

    console.log("before Account Base Balance: " + await Base.balanceOf(account.address));
    console.log("before Account Quote Balance: " + await Quote.balanceOf(account.address));    

    //let { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WFTM.baseTokenAddress);
    let { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WBNB.baseTokenAddress);
    //let { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WMATIC.baseTokenAddress);
    //let { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WETH.baseTokenAddress);//op and arb

    console.log("===== Adapter =====");
    IntegrationTestAdapter = await ethers.getContractFactory("DoppleAdapter");
    integrationTestAdapter = await IntegrationTestAdapter.deploy();
    await integrationTestAdapter.deployed();


    // transfer 1 USDT to Pool or adapter
    const fromTokenAmount = ethers.utils.parseUnits("1", tokenConfig.tokens.USDT.decimals);
    const minReturnAmount = 0;
    const deadLine = FOREVER;
    const poolAddress = "0x5162f992EDF7101637446ecCcD5943A9dcC63A8A";//router1（bsc）DAI-BUSD-USDT-USDC 1USDT



    const mixAdapter1 = [
        integrationTestAdapter.address
    ];
    const assetTo1 = [
        integrationTestAdapter.address//or poolAddress
    ];
    const weight1 = Number(10000).toString(16).replace('0x', '');
    const rawData1 = [
        "0x" +
        "0" +                          // 0/8
        "0000000000000000000" +
        weight1 +
        poolAddress.replace("0x", "")  // Pool
    ];
    //moreInfo
    const BaseIndex = '2';//this adapter need index of token address
    const QuoteIndex = '0';
    const moreInfo1 = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint8", "uint8"],
      [FOREVER, Base.address, Quote.address, BaseIndex, QuoteIndex]
    )
    const extraData1 = [moreInfo1];
    const router1 = [mixAdapter1, assetTo1, rawData1, extraData1, Base.address];

    // layer1
    const layer1 = [router1];
    const orderId = 0;

    const baseRequest = [
        Base.address,
        Quote.address,
        fromTokenAmount,
        minReturnAmount,
        deadLine,
    ]

    await Base.connect(account).approve(tokenApprove.address, fromTokenAmount);
   
    console.log("\n================== smartSwapByOrderId ==================");
    tx = await dexRouter.connect(account).smartSwapByOrderId(
        orderId,
        baseRequest,
        [fromTokenAmount],
        [layer1],
        pmmReq
    );

    console.log("after Base Balance: " + await Base.balanceOf(account.address));
    console.log("after Quote Balance: " + await Quote.balanceOf(account.address));
}

// Compare TX：dopple
// https://bscscan.com/tx/0xec7c09bac2598d6c8f3edd151cde27dda88dcff8552450c525c2958d43569099
async function main() {
    await executeBase2Quote();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
