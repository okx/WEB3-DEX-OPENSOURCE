const { assert } = require("chai");
const { ethers } = require("hardhat");
require("../../tools");
const { getConfig } = require("../../config");
const { initDexRouter, direction, FOREVER, packRawData} = require("./utils")
tokenConfig = getConfig("eth");



async function executeBase2Quote() {
    const pmmReq = []
    // Network eth
    await setForkNetWorkAndBlockNumber('eth',18026522);

    const accountAddress = "0x358506b4C5c441873AdE429c5A2BE777578E2C6f";
    await startMockAccount([accountAddress]);
    const account = await ethers.getSigner(accountAddress);
    await setBalance(accountAddress, "0x1bc16d674ec80000"); // 2 eth

    Base = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.sUSD.baseTokenAddress
    )
      Quote = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.sETH.baseTokenAddress
    )

    console.log("before Account Base Balance: " + await Base.balanceOf(account.address));
    console.log("before Account Quote Balance: " + await Quote.balanceOf(account.address));    

    let { dexRouter, tokenApprove } = await initDexRouter(tokenConfig.tokens.WETH.baseTokenAddress);//eth op

    console.log("===== Adapter =====");
    const snxproxyAddr = "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F";//eth
    IntegrationTestAdapter = await ethers.getContractFactory("SynthetixExchangeAtomicallyAdapter");
    integrationTestAdapter = await IntegrationTestAdapter.deploy(snxproxyAddr);
    await integrationTestAdapter.deployed();


    // transfer 1 sUSD to Pool or adapter
    const fromTokenAmount = ethers.utils.parseUnits("0.997", tokenConfig.tokens.sUSD.decimals);
    const minReturnAmount = 0;
    const deadLine = FOREVER;
    const poolAddress = "0x0000000000000000000000000000000000000000";//1 sUSD-sETH



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

    //moreInfo1
    const sourceCurrencyKey = '0x7355534400000000000000000000000000000000000000000000000000000000';//sUSD
    const destinationCurrencyKey = '0x7345544800000000000000000000000000000000000000000000000000000000';//sETH
    const moreInfo1 = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "address", "address"],
      [sourceCurrencyKey, destinationCurrencyKey, Base.address, Quote.address]
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

// Compare TX：kwenta
// https://etherscan.io/tx/0x17e87b4184b288e5a2b03d08611cd2006d456d29689e8b99d75f5593d414e9d4/advanced
async function main() {
    await executeBase2Quote();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
