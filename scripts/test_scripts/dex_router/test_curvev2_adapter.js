let { ethers } = require("hardhat");
require("../../tools");
let { getConfig } = require("../../config");
tokenConfig = getConfig("eth");
let { initDexRouter, direction, FOREVER } = require("./utils")

async function executeTricrypto() {
    await setForkBlockNumber(14436483);

    // V神
    let accountAddress = "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296";
    await startMockAccount([accountAddress]);
    let account = await ethers.getSigner(accountAddress);
  
    // set account balance 0.6 eth
    await setBalance(accountAddress, "0x53444835ec580000");
    
    // USDT
    USDT = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.USDT.baseTokenAddress
      )

    // WETH
    WETH = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.WETH.baseTokenAddress
    )

    console.log("before Account USDT Balance: " + await USDT.balanceOf(account.address));
    console.log("before Account WETH Balance: " + await WETH.balanceOf(account.address));

    let { dexRouter, tokenApprove } = await initDexRouter(WETH.address);

    CurveV2Adapter = await ethers.getContractFactory("CurveV2Adapter");
    CurveV2Adapter = await CurveV2Adapter.deploy(tokenConfig.tokens.WETH.baseTokenAddress);
    await CurveV2Adapter.deployed();

    // transfer 500 USDT to curveAdapter
    let fromTokenAmount = ethers.utils.parseUnits("500", tokenConfig.tokens.USDT.decimals);
    let minReturnAmount = 0;
    let deadLine = FOREVER;
    let poolAddress = "0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5"; 
    await USDT.connect(account).transfer(CurveV2Adapter.address, fromTokenAmount);
    console.log("before CurveV2Adapter USDT Balance: " + await USDT.balanceOf(CurveV2Adapter.address));



    // arguments
    let requestParam1 = [
        tokenConfig.tokens.USDT.baseTokenAddress,
        [fromTokenAmount]
    ];
    let mixAdapter1 = [
        CurveV2Adapter.address
    ];
    let assertTo1 = [
        CurveV2Adapter.address
    ];
    let weight1 = Number(10000).toString(16).replace('0x', '');
    let rawData1 = [
        "0x" + 
        direction(tokenConfig.tokens.USDT.baseTokenAddress, tokenConfig.tokens.WETH.baseTokenAddress) + 
        "0000000000000000000" + 
        weight1 + 
        poolAddress.replace("0x", "")  // three pools
    ];
    let moreInfo =  ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "int128", "int128"],
        [
            USDT.address,
            WETH.address,
            0,
            2
        ]
      )
    let extraData1 = [moreInfo];
    let router1 = [mixAdapter1, assertTo1, rawData1, extraData1];
      
    //   // layer1
    let request1 = [requestParam1];
    let layer1 = [router1];

    let baseRequest = [
        USDT.address,
        WETH.address,
        fromTokenAmount,
        minReturnAmount,
        deadLine,
    ]
    await USDT.connect(account).approve(tokenApprove.address, fromTokenAmount);
    await dexRouter.connect(account).smartSwap(
        baseRequest,
        [fromTokenAmount],
        [request1],
        [layer1],
    );

    console.log("after Account USDT Balance: " + await USDT.balanceOf(account.address));
    console.log("after Account WETH Balance: " + await WETH.balanceOf(account.address));
}

async function executeTwoCrypto() {

    accountAddress = "0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296";
    account = await ethers.getSigner(accountAddress);

    // WETH
    WETH = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.WETH.baseTokenAddress
    )

    SETH = await ethers.getContractAt(
        "MockERC20",
        tokenConfig.tokens.SETH.baseTokenAddress
      )


    let { dexRouter, tokenApprove } = await initDexRouter(WETH.address);

    CurveV2Adapter = await ethers.getContractFactory("CurveV2Adapter");
    CurveV2Adapter = await CurveV2Adapter.deploy(tokenConfig.tokens.WETH.baseTokenAddress);
    await CurveV2Adapter.deployed();

    // transfer 500 USDT to curveAdapter
    fromTokenAmount =  ethers.utils.parseEther("0.2");
    minReturnAmount = 0;
    deadLine = FOREVER;
    let poolAddress = "0xc5424b857f758e906013f3555dad202e4bdb4567"; 
    console.log("before Account SETH Balance: " + await SETH.balanceOf(account.address));


    // arguments
    requestParam1 = [
        tokenConfig.tokens.WETH.baseTokenAddress,
        [fromTokenAmount]
    ];
    mixAdapter1 = [
        CurveV2Adapter.address
    ];
    assertTo1 = [
        CurveV2Adapter.address
    ];
    weight1 = Number(10000).toString(16).replace('0x', '');
    rawData1 = [
        "0x" + 
        direction(tokenConfig.tokens.ETH.baseTokenAddress, tokenConfig.tokens.SETH.baseTokenAddress) + 
        "0000000000000000000" + 
        weight1 + 
        poolAddress.replace("0x", "")  // three pools
    ];
    moreinfo =  ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "int128", "int128"],
        [
            tokenConfig.tokens.ETH.baseTokenAddress,
            tokenConfig.tokens.SETH.baseTokenAddress,
            0,
            1
        ]
      )
    extraData1 = [moreinfo];
    router1 = [mixAdapter1, assertTo1, rawData1, extraData1];
      
    //   // layer1
    request1 = [requestParam1];
    layer1 = [router1];

    baseRequest = [
        tokenConfig.tokens.ETH.baseTokenAddress,
        tokenConfig.tokens.SETH.baseTokenAddress,
        fromTokenAmount,
        minReturnAmount,
        deadLine,
    ]

    await dexRouter.connect(account).smartSwap(
        baseRequest,
        [fromTokenAmount],
        [request1],
        [layer1],
        {value: fromTokenAmount}
    );

    console.log("after Account SETH Balance: " + await SETH.balanceOf(account.address));
}



async function main() {
    console.log(" ============= Curve tricrypto pool ===============");
    await executeTricrypto();
    console.log(" ============= Curve meta pool ===============");
    await executeTwoCrypto();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });






