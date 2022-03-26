const { ethers } = require('hardhat')
const { expect } = require('chai')

describe("Smart route path test", function() {

  const FOREVER = '2000000000';
  let wbtc, weth, dot, bnb, usdc, usdt
  let router, tokenApprove, dexRouter
  let owner, alice, bob, liquidity;

  beforeEach(async function() {
    [owner, alice, bob, liquidity] = await ethers.getSigners();

    await initMockTokens();
    await initDexRouter();

    const pairs = [
      [weth, usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('300000')],
      [wbtc, usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('3000000')],
      [wbtc, weth, ethers.utils.parseEther('1000'), ethers.utils.parseEther('10000')],
      [weth, dot, ethers.utils.parseEther('100'), ethers.utils.parseEther('1000')],
      [dot,  usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('3000')],
      [wbtc, dot, ethers.utils.parseEther('100'), ethers.utils.parseEther('100000')],
      [usdt, usdc, ethers.utils.parseEther('10000'), ethers.utils.parseEther('10000')],
      [bnb, weth, ethers.utils.parseEther('100'), ethers.utils.parseEther('10000')],
      [bnb, wbtc, ethers.utils.parseEther('100'), ethers.utils.parseEther('100000')],
    ]
    for (let i = 0; i < pairs.length; i++) {
      await addLiquidity(
        pairs[i][0],
        pairs[i][1],
        pairs[i][2], 
        pairs[i][3],
      );
    }
  });

  it("mixSwap with single path", async () => {
    // wbtc -> weth -> usdt
    console.log("before: " + await usdt.balanceOf(alice.address));

    fromToken = wbtc;
    toToken = usdt;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, fromTokenAmount);

    // node1
    const requestParam1 = [
      wbtc.address,
      [fromTokenAmount]
    ];
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];

    const weight1 = Number(10000).toString(16).replace('0x', '');
    const rawData1 = [
      "0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1];

    // node2
    const requestParam2 = [
      weth.address,
      [0],
    ];
    const mixAdapter2 = [
      uniAdapter.address
    ];
    const assertTo2 = [
      lpWETHUSDT.address,
    ];
    const weight2 = Number(10000).toString(16)
    const rawData2 = ["0x" + direction(weth.address, usdt.address) + "0000000000000000000" + weight2 + lpWETHUSDT.address.replace("0x", "")];
    const extraData2 = [0x0];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2];

    // layer1
    const request1 = [requestParam1, requestParam2];
    const layer1 = [router1, router2];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
    ]
    await dexRouter.connect(alice).smartSwap(
      baseRequest,
      [fromTokenAmount],
      [request1],
      [layer1],
    );

    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    // reveiveAmount = fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997);
    // wbtc -> weth 1:10
    // 10000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  10000000000000000000 * 997) = 98715803439706130000
    // weth -> usdt 1:3000
    // 98715803439706130000 * 997 * 300000000000000000000000 / (100000000000000000000 * 1000 +  98715803439706130000 * 997) = 148805301851965514608651
    expect(await usdt.balanceOf(alice.address)).to.be.eq("148805301851965514608651");
    // console.log("after: " + await usdt.balanceOf(alice.address));
  });

  it("mixSwap with two fork path", async () => {
    // wbtc -> weth -> usdt
    //      -> dot  -> usdt

    const fromToken = wbtc;
    const toToken = usdt;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const fromTokenAmount1 = ethers.utils.parseEther('5');
    const fromTokenAmount2 = ethers.utils.parseEther('5');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // node1
    const requestParam1 = [
      wbtc.address,
      [fromTokenAmount1]
    ];
    const mixAdapter1 = [
      uniAdapter.address
    ]
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = Number(10000).toString(16).replace('0x', '');
    const rawData1 = ["0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1];

    const requestParam3 = [
      weth.address,
      [0],
    ];
    const mixAdapter3 = [
      uniAdapter.address,
    ];
    const assertTo3 = [
      lpWETHUSDT.address,
    ];
    const weight3 = Number(10000).toString(16).replace('0x', '');
    const rawData3 = ["0x" + direction(weth.address, usdt.address) + "0000000000000000000" + weight3 + lpWETHUSDT.address.replace("0x", "")];
    const extraData3 = [0x0];
    const router3 = [mixAdapter3, assertTo3, rawData3, extraData3];

    // node2
    const requestParam2 = [
      wbtc.address,
      [fromTokenAmount2],
    ];
    const mixAdapter2 = [
      uniAdapter.address,
    ];
    const assertTo2 = [
      lpWBTCDOT.address,
    ];
    const weight2 = Number(10000).toString(16).replace('0x', '');
    const rawData2 = ["0x" + direction(wbtc.address, dot.address) + "0000000000000000000" + weight2 + lpWBTCDOT.address.replace("0x", "")];
    const extraData2 = [0x0];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2];

    const requestParam4 = [
      dot.address,
      [0],
    ];
    const mixAdapter4 = [
      uniAdapter.address,
    ];
    const assertTo4 = [
      lpDOTUSDT.address,
    ];
    const weight4 = Number(10000).toString(16).replace('0x', '');
    const rawData4 = ["0x" + direction(dot.address, usdt.address) + "0000000000000000000" + weight4 + lpDOTUSDT.address.replace("0x", "")];
    const extraData4 = [0x0];
    const router4 = [mixAdapter4, assertTo4, rawData4, extraData4];

    // layer1
    const request1 = [requestParam1, requestParam3];
    const layer1 = [router1, router3];
    const request2 = [requestParam2, requestParam4];
    const layer2 = [router2, router4];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
    ]
    await dexRouter.connect(alice).smartSwap(
      baseRequest,
      [fromTokenAmount1, fromTokenAmount2],
      [request1, request2],
      [layer1, layer2],
    );

    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    // wbtc -> weth
    // 5000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  5000000000000000000 * 997) = 49602730389010784000
    // weth -> usdt
    // 49602730389010784000 * 997 * 300000000000000000000000 / (100000000000000000000 * 1000 +  49602730389010784000 * 997) = 9.926923590344674e+22
    // wbtc -> dot
    // 5000000000000000000 * 997 * 100000000000000000000000 / (100000000000000000000 * 1000 +  5000000000000000000 * 997) = 4748297375815592703719
    // dot -> usdt
    // 4748297375815592703719 * 997 * 3000000000000000000000 / (100000000000000000000 * 1000 +  4748297375815592703719 * 997) = 2.937940268333389e+21
    // usdt: 9.926923590344674e+22 + 2.937940268333389e+21 = 10220717617178012e+23 (102207176171780117650753)
    expect(await usdt.balanceOf(alice.address)).to.be.eq("102207176171780117650753");
  });

  it("mixSwap with four path, same token", async () => {
    // wbtc -> weth(uni)
    //      -> weth(curve)
    //      -> weth(dodo)

    console.log("before: " + await weth.balanceOf(alice.address));

    fromToken = wbtc;
    toToken = weth;
    fromTokenAmount = ethers.utils.parseEther('10');
    const fromTokenAmount1 = ethers.utils.parseEther('2');
    const fromTokenAmount2 = ethers.utils.parseEther('3');
    const fromTokenAmount3 = ethers.utils.parseEther('5');
    minReturnAmount = 0;
    deadLine = FOREVER;

    await wbtc.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // node1
    const requestParam1 = [
      wbtc.address,
      [fromTokenAmount1, fromTokenAmount2, fromTokenAmount3]
    ];

    const mixAdapter1 = [
      uniAdapter.address,
      uniAdapter.address, // change curve adapter
      uniAdapter.address  // change dodo  adapter
    ];
    const assertTo1 = [
      lpWBTCWETH.address,
      lpWBTCWETH.address,
      lpWBTCWETH.address
    ];
    // The first flash swap weight does not work
    const weight1 = Number(2000).toString(16).replace('0x', '');
    const weight2 = Number(3000).toString(16).replace('0x', '');
    const weight3 = Number(5000).toString(16).replace('0x', '');
    const rawData1 = [
      "0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", ""),
      "0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight2 + lpWBTCWETH.address.replace("0x", ""),
      "0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight3 + lpWBTCWETH.address.replace("0x", ""),
    ];
    const extraData1 = [0x0, 0x0, 0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1];

    // layer1
    const request1 = [requestParam1];
    const layer1 = [router1];

    baseRequest = [
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine
    ]

    await dexRouter.connect(alice).smartSwap(
      baseRequest,
      [fromTokenAmount],
      [request1],
      [layer1],
    );
    
    // wbtc -> weth
    // 2000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  2000000000000000000 * 997) = 19900318764383818000
    // 3000000000000000000 * 997 * 9980099681235616181335 / (1002000000000000000000 * 1000 +  3000000000000000000 * 997) = 29702234295208346000
    // 5000000000000000000 * 997 * 9950397446940407838178 / (1005000000000000000000 * 1000 +  5000000000000000000 * 997) = 49112344513035270000
    // 19900318764383818000 + 29820805969345690000 + 49602730389010784000 = 98714897572627430000 ~> 98714897572627437666
    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    expect(await weth.balanceOf(alice.address)).to.be.eq("98714897572627437666");
  });

  it("mixSwap with three fork path", async () => {
    //       -> weth -> usdt
    //  wbtc -> dot  -> usdt
    //       -> bnb  -> weth -> usdt
    //               -> weth -> usdt

    const fromToken = wbtc;
    const toToken = usdt;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const fromTokenAmount1 = ethers.utils.parseEther('2');
    const fromTokenAmount2 = ethers.utils.parseEther('3');
    const fromTokenAmount3 = ethers.utils.parseEther('5');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // wbtc -> weth
    const requestParam1 = [
      wbtc.address,
      [0]
    ];
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = Number(10000).toString(16).replace('0x', '');
    const rawData1 = ["0x" + direction(wbtc.address, weth.address) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1];

    // weth -> usdt
    const requestParam3 = [
      weth.address,
      [0],
    ];
    const mixAdapter3 = [
      uniAdapter.address,
    ];
    const assertTo3 = [
      lpWETHUSDT.address,
    ];
    const weight3 = Number(10000).toString(16).replace('0x', '');
    const rawData3 = ["0x" + direction(weth.address, usdt.address) + "0000000000000000000" + weight3 + lpWETHUSDT.address.replace("0x", "")];
    const extraData3 = [0x0];
    const router3 = [mixAdapter3, assertTo3, rawData3, extraData3];

    // wbtc -> dot
    const requestParam2 = [
      wbtc.address,
      [0],
    ];
    const mixAdapter2 = [
      uniAdapter.address,
    ];
    const assertTo2 = [
      lpWBTCDOT.address,
    ];
    const weight2 = Number(10000).toString(16).replace('0x', '');
    const rawData2 = ["0x" + direction(wbtc.address, dot.address) + "0000000000000000000" + weight2 + lpWBTCDOT.address.replace("0x", "")];
    const extraData2 = [0x0];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2];

    // dot -> usdt
    const requestParam4 = [
      dot.address,
      [0],
    ];
    const mixAdapter4 = [
      uniAdapter.address,
    ];
    const assertTo4 = [
      lpDOTUSDT.address
    ];
    const weight4 = Number(10000).toString(16).replace('0x', '');
    const rawData4 = ["0x" + direction(dot.address, usdt.address) + "0000000000000000000" + weight4 + lpDOTUSDT.address.replace("0x", "")];
    const extraData4 = [0x0];
    const router4 = [mixAdapter4, assertTo4, rawData4, extraData4];

    // wbtc -> bnb
    const requestParam5 = [
      wbtc.address,
      [0],
    ];
    const mixAdapter5 = [
      uniAdapter.address
    ];
    const assertTo5 = [
      lpWBTCBNB.address
    ];
    const weight5 = Number(10000).toString(16).replace('0x', '');
    const rawData5 = ["0x" + direction(wbtc.address, bnb.address) + "0000000000000000000" + weight5 + lpWBTCBNB.address.replace("0x", "")];
    const extraData5 = [0x0];
    const router5 = [mixAdapter5, assertTo5, rawData5, extraData5];

    // bnb -> weth
    const requestParam6 = [
      bnb.address,
      [0, 0],
    ];
    const mixAdapter6 = [
      uniAdapter.address,
      uniAdapter.address,
    ];
    const assertTo6 = [
      lpBNBWETH.address,
      lpBNBWETH.address
    ];
    const weight61 = Number(8000).toString(16).replace('0x', '');
    const weight62 = Number(2000).toString(16).replace('0x', '');
    const rawData6 = [
      "0x" + direction(bnb.address, weth.address) + "0000000000000000000" + weight61 + lpBNBWETH.address.replace("0x", ""),
      "0x" + direction(bnb.address, weth.address) + "0000000000000000000" + weight62 + lpBNBWETH.address.replace("0x", "")
    ];
    const extraData6 = [0x0, 0x0];
    const router6 = [mixAdapter6, assertTo6, rawData6, extraData6];

    // weth -> usdt
    const requestParam7 = [
      weth.address,
      [0]
    ];
    const mixAdapter7 = [
      uniAdapter.address,
    ];
    const assertTo7 = [
      lpWETHUSDT.address,
    ];
    const weight7 = Number(10000).toString(16).replace('0x', '');
    const rawData7 = ["0x" + direction(weth.address, usdt.address) + "0000000000000000000" + weight7 + lpWETHUSDT.address.replace("0x", "")];
    const extraData7 = [0x0];
    const router7 = [mixAdapter7, assertTo7, rawData7, extraData7];

    // layer1
    const request1 = [requestParam1, requestParam3];
    const layer1 =   [router1, router3];
    const request2 = [requestParam2, requestParam4];
    const layer2 =   [router2, router4];
    const request3 = [requestParam5, requestParam6, requestParam7];
    const layer3 =   [router5, router6, router7];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
    ]
    await dexRouter.connect(alice).smartSwap(
      baseRequest,
      [fromTokenAmount1, fromTokenAmount2, fromTokenAmount3],
      [request1, request2, request3],
      [layer1, layer2, layer3],
    );

    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    console.log("after: " + await usdt.balanceOf(alice.address));
  });

  const direction = function(token0, token1) {
    return token0 > token1 ? 0 : 8;
  }

  const addLiquidity = async (token0, token1, amount0, amount1) => {
    await token0.connect(bob).approve(router.address, amount0);
    await token1.connect(bob).approve(router.address, amount1);
    await router.connect(bob).addLiquidity(
      token0.address,
      token1.address,
      amount0, 
      amount1, 
      '0', 
      '0', 
      bob.address,
      FOREVER
    );
  }

  const initMockTokens = async () => {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
  
    usdt = await MockERC20.deploy('USDT', 'USDT', ethers.utils.parseEther('10000000000'));
    await usdt.deployed();
    await usdt.transfer(alice.address, ethers.utils.parseEther('0'));
    await usdt.transfer(bob.address, ethers.utils.parseEther('100000000'));
  
    wbtc = await MockERC20.deploy('WBTC', 'WBTC', ethers.utils.parseEther('10000000000'));
    await wbtc.deployed();
    await wbtc.transfer(alice.address, ethers.utils.parseEther('100'));
    await wbtc.transfer(bob.address, ethers.utils.parseEther('100000000'));
  
    dot = await MockERC20.deploy('DOT', 'DOT', ethers.utils.parseEther('10000000000'));
    await dot.deployed();
    await dot.transfer(alice.address, ethers.utils.parseEther('0'));
    await dot.transfer(bob.address, ethers.utils.parseEther('100000000'));
  
    bnb = await MockERC20.deploy('BNB', 'BNB', ethers.utils.parseEther('10000000000'));
    await bnb.deployed();
    await bnb.transfer(alice.address, ethers.utils.parseEther('100'));
    await bnb.transfer(bob.address, ethers.utils.parseEther('100000000'));
  
    usdc = await MockERC20.deploy('USDC', 'USDC', ethers.utils.parseEther('10000000000'));
    await usdc.deployed();
    await usdc.transfer(alice.address, ethers.utils.parseEther('0'));
    await usdc.transfer(bob.address, ethers.utils.parseEther('100000000'));
  
    weth = await MockERC20.deploy("WETH", "WETH", ethers.utils.parseEther('10000000000'));
    await weth.deployed();
    await weth.transfer(bob.address, ethers.utils.parseEther('100000000'));
  }

  const initDexRouter = async () => {
    const WETH9 = await ethers.getContractFactory("WETH9");
    weth9 = await WETH9.deploy();

    TokenApproveProxy = await ethers.getContractFactory("TokenApproveProxy");
    tokenApproveProxy = await TokenApproveProxy.deploy();
    await tokenApproveProxy.initialize();
    await tokenApproveProxy.deployed();

    TokenApprove = await ethers.getContractFactory("TokenApprove");
    tokenApprove = await TokenApprove.deploy();
    await tokenApprove.initialize(tokenApproveProxy.address);
    await tokenApprove.deployed();

    DexRouter = await ethers.getContractFactory("DexRouter");
    dexRouter = await upgrades.deployProxy(
      DexRouter,
      [
        weth9.address,
      ]  
    )
    await dexRouter.deployed();
    await dexRouter.setTokenAprrove(tokenApprove.address);
    await dexRouter.setApproveProxy(tokenApproveProxy.address);

    await tokenApproveProxy.addProxy(dexRouter.address);
    await tokenApproveProxy.setTokenApprove(tokenApprove.address);

    UniAdapter = await ethers.getContractFactory("UniAdapter");
    uniAdapter = await UniAdapter.deploy();

    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(owner.address);
    await factory.deployed();
    const UniswapV2Router = await ethers.getContractFactory("UniswapRouter");
    router = await UniswapV2Router.deploy(factory.address, weth9.address);
    await router.deployed();

    await factory.createPair(wbtc.address, dot.address);
    await factory.createPair(wbtc.address, usdt.address);
    await factory.createPair(wbtc.address, usdc.address);
    await factory.createPair(wbtc.address, weth.address);
    await factory.createPair(wbtc.address, bnb.address);
    await factory.createPair(dot.address, usdt.address);
    await factory.createPair(dot.address, weth.address);
    await factory.createPair(usdt.address, weth.address);
    await factory.createPair(bnb.address, usdc.address);
    await factory.createPair(bnb.address, usdt.address);
    await factory.createPair(bnb.address, weth.address);
    const UniswapPair = await ethers.getContractFactory("UniswapV2Pair");

    pair = await factory.getPair(wbtc.address, dot.address)
    lpWBTCDOT = await UniswapPair.attach(pair);

    pair = await factory.getPair(dot.address, usdt.address)
    lpDOTUSDT = await UniswapPair.attach(pair);

    pair = await factory.getPair(wbtc.address, bnb.address);
    lpWBTCBNB = await UniswapPair.attach(pair);

    pair = await factory.getPair(wbtc.address, usdc.address);
    lpWBTCUSDC = await UniswapPair.attach(pair);

    pair = await factory.getPair(bnb.address, usdc.address);
    lpBNBUSDC = await UniswapPair.attach(pair);

    pair = await factory.getPair(wbtc.address, usdt.address);
    lpWBTCUSDT = await UniswapPair.attach(pair);

    pair = await factory.getPair(usdt.address, weth.address);
    lpWETHUSDT = await UniswapPair.attach(pair);

    pair = await factory.getPair(dot.address, weth.address);
    lpWETHDOT = await UniswapPair.attach(pair);

    pair = await factory.getPair(wbtc.address, weth.address);
    lpWBTCWETH = await UniswapPair.attach(pair);

    pair = await factory.getPair(bnb.address, weth.address);
    lpBNBWETH = await UniswapPair.attach(pair);
  }
});