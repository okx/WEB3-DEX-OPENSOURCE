const { ethers } = require('hardhat')

describe("Smart route path test", function() {

  const FOREVER = '2000000000';
  let wbtc, weth, dot, bnb, usdc, usdt
  let router, tokenApprove, dexRouteProxy
  let owner, alice, bob, liquidity;

  before(async function() {
    [owner, alice, bob, liquidity] = await ethers.getSigners();

    await initMockTokens();
    await initSOR();

    const pairs = [
      [weth, usdt, ethers.utils.parseEther('10'), ethers.utils.parseEther('30000')],
      [wbtc, usdt, ethers.utils.parseEther('10'), ethers.utils.parseEther('300000')],
      [wbtc, weth, ethers.utils.parseEther('10'), ethers.utils.parseEther('100')],
      [weth, dot, ethers.utils.parseEther('10'), ethers.utils.parseEther('100')],
      [dot,  usdt, ethers.utils.parseEther('10'), ethers.utils.parseEther('300')],
      [wbtc, dot, ethers.utils.parseEther('10'), ethers.utils.parseEther('10000')],
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

  xit("mixSwap with single path", async () => {
    // wbtc -> weth -> usdt
    console.log("before: " + await usdt.balanceOf(alice.address));

    const fromToken = wbtc;
    const toToken = usdt;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, fromTokenAmount);

    // node1
    const requestParam1 = [
      [wbtc.address],
      [weth.address],
      [fromTokenAmount]
    ];
    const mixAdapter1 = [
      [uniAdapter.address]
    ];
    const mixPair1 = [
      [lpWBTCWETH.address]
    ];
    const assertTo1 = [
      [lpWBTCWETH.address, dexRouteProxy.address]
    ];
    const weight1 = [[10000]];
    const directions1 = [[direction(wbtc.address, weth.address)]];
    const extraData1 = [[0x0]];
    const router1 = [mixAdapter1, mixPair1, assertTo1, weight1, directions1, extraData1];

    // node2
    const requestParam2 = [
      [weth.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter2 = [
      [uniAdapter.address],
    ];
    const mixPair2 = [
      [lpWETHUSDT.address],
    ];
    const assertTo2 = [
      [lpWETHUSDT.address, dexRouteProxy.address],
    ];
    const weight2 = [[10000]];
    const directions2 = [[direction(weth.address, usdt.address)]];
    const extraData2 = [[0x0]];
    const router2 = [mixAdapter2, mixPair2, assertTo2, weight2, directions2, extraData2];

    // layer1
    const request1 = [requestParam1, requestParam2];
    const layer1 = [router1, router2];

    await dexRouteProxy.connect(alice).mutliSwap(
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
      [request1],
      [layer1],
    );
  });

  xit("mixSwap with two fork path", async () => {
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
      [wbtc.address],
      [weth.address],
      [fromTokenAmount1]
    ];
    const mixAdapter1 = [
      [uniAdapter.address]
    ];
    const mixPair1 = [
      [lpWBTCWETH.address]
    ];
    const assertTo1 = [
      [lpWBTCWETH.address, dexRouteProxy.address]
    ];
    const weight1 = [[10000]];
    const directions1 = [[direction(wbtc.address, weth.address)]];
    const extraData1 = [[0x0]];
    const router1 = [mixAdapter1, mixPair1, assertTo1, weight1, directions1, extraData1];

    // node2
    const requestParam2 = [
      [wbtc.address],
      [dot.address],
      [fromTokenAmount2],
    ];
    const mixAdapter2 = [
      [uniAdapter.address],
    ];
    const mixPair2 = [
      [lpWBTCDOT.address],
    ];
    const assertTo2 = [
      [lpWBTCDOT.address, dexRouteProxy.address],
    ];
    const weight2 = [[10000]];
    const directions2 = [[direction(wbtc.address, dot.address)]];
    const extraData2 = [[0x0]];
    const router2 = [mixAdapter2, mixPair2, assertTo2, weight2, directions2, extraData2];

    const requestParam3 = [
      [weth.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter3 = [
      [uniAdapter.address],
    ];
    const mixPair3 = [
      [lpWETHUSDT.address],
    ];
    const assertTo3 = [
      [lpWETHUSDT.address, dexRouteProxy.address],
    ];
    const weight3 = [[10000]];
    const directions3 = [[direction(weth.address, usdt.address)]];
    const extraData3 = [[0x0]];
    const router3 = [mixAdapter3, mixPair3, assertTo3, weight3, directions3, extraData3];

    const requestParam4 = [
      [dot.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter4 = [
      [uniAdapter.address],
    ];
    const mixPair4 = [
      [lpDOTUSDT.address],
    ];
    const assertTo4 = [
      [lpDOTUSDT.address, dexRouteProxy.address],
    ];
    const weight4 = [[10000]];
    const directions4 = [[direction(dot.address, usdt.address)]];
    const extraData4 = [[0x0]];
    const router4 = [mixAdapter4, mixPair4, assertTo4, weight4, directions4, extraData4];

    // layer1
    const request1 = [requestParam1, requestParam3];
    const layer1 = [router1, router3];
    const request2 = [requestParam2, requestParam4];
    const layer2 = [router2, router4];

    await dexRouteProxy.connect(alice).mutliSwap(
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
      [request1, request2],
      [layer1, layer2],
    );
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
    const fromTokenAmount2 = ethers.utils.parseEther('6');
    const fromTokenAmount3 = ethers.utils.parseEther('2');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // wbtc -> weth
    const requestParam1 = [
      [wbtc.address],
      [weth.address],
      [fromTokenAmount1]
    ];
    const mixAdapter1 = [
      [uniAdapter.address]
    ];
    const mixPair1 = [
      [lpWBTCWETH.address]
    ];
    const assertTo1 = [
      [lpWBTCWETH.address, dexRouteProxy.address]
    ];
    const weight1 = [[10000]];
    const directions1 = [[direction(wbtc.address, weth.address)]];
    const extraData1 = [[0x0]];
    const router1 = [mixAdapter1, mixPair1, assertTo1, weight1, directions1, extraData1];

    // weth -> usdt
    const requestParam3 = [
      [weth.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter3 = [
      [uniAdapter.address],
    ];
    const mixPair3 = [
      [lpWETHUSDT.address],
    ];
    const assertTo3 = [
      [lpWETHUSDT.address, dexRouteProxy.address],
    ];
    const weight3 = [[10000]];
    const directions3 = [[direction(weth.address, usdt.address)]];
    const extraData3 = [[0x0]];
    const router3 = [mixAdapter3, mixPair3, assertTo3, weight3, directions3, extraData3];

    // wbtc -> dot
    const requestParam2 = [
      [wbtc.address],
      [dot.address],
      [fromTokenAmount2],
    ];
    const mixAdapter2 = [
      [uniAdapter.address],
    ];
    const mixPair2 = [
      [lpWBTCDOT.address],
    ];
    const assertTo2 = [
      [lpWBTCDOT.address, dexRouteProxy.address],
    ];
    const weight2 = [[10000]];
    const directions2 = [[direction(wbtc.address, dot.address)]];
    const extraData2 = [[0x0]];
    const router2 = [mixAdapter2, mixPair2, assertTo2, weight2, directions2, extraData2];

    // dot -> usdt
    const requestParam4 = [
      [dot.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter4 = [
      [uniAdapter.address],
    ];
    const mixPair4 = [
      [lpDOTUSDT.address],
    ];
    const assertTo4 = [
      [lpDOTUSDT.address, dexRouteProxy.address],
    ];
    const weight4 = [[10000]];
    const directions4 = [[direction(dot.address, usdt.address)]];
    const extraData4 = [[0x0]];
    const router4 = [mixAdapter4, mixPair4, assertTo4, weight4, directions4, extraData4];

    // wbtc -> bnb
    const requestParam5 = [
      [wbtc.address],
      [bnb.address],
      [fromTokenAmount3],
    ];
    const mixAdapter5 = [
      [uniAdapter.address],
    ];
    const mixPair5 = [
      [lpWBTCBNB.address],
    ];
    const assertTo5 = [
      [lpWBTCBNB.address, dexRouteProxy.address],
    ];
    const weight5 = [[10000]];
    const directions5 = [[direction(wbtc.address, bnb.address)]];
    const extraData5 = [[0x0]];
    const router5 = [mixAdapter5, mixPair5, assertTo5, weight5, directions5, extraData5];

    // bnb -> weth
    const requestParam6 = [
      [bnb.address, bnb.address],
      [weth.address, weth.address],
      [0, 0],
    ];
    const mixAdapter6 = [
      [uniAdapter.address],
      [uniAdapter.address],
    ];
    const mixPair6 = [
      [lpBNBWETH.address],
      [lpBNBWETH.address],
    ];
    const assertTo6 = [
      [lpBNBWETH.address, dexRouteProxy.address],
      [lpBNBWETH.address, dexRouteProxy.address],
    ];
    const weight6 = [[8000], [2000]];
    const directions6 = [[direction(bnb.address, weth.address)], [direction(bnb.address, weth.address)]];
    const extraData6 = [[0x0], [0x0]];
    const router6 = [mixAdapter6, mixPair6, assertTo6, weight6, directions6, extraData6];

    // weth -> usdt
    const requestParam7 = [
      [weth.address],
      [usdt.address],
      [0],
    ];
    const mixAdapter7 = [
      [uniAdapter.address],
    ];
    const mixPair7 = [
      [lpWETHUSDT.address],
    ];
    const assertTo7 = [
      [lpWETHUSDT.address, dexRouteProxy.address],
    ];
    const weight7 = [[10000]];
    const directions7 = [[direction(weth.address, usdt.address)]];
    const extraData7 = [[0x0]];
    const router7 = [mixAdapter7, mixPair7, assertTo7, weight7, directions7, extraData7];

    // layer1
    const request1 = [requestParam1, requestParam3];
    const layer1 = [router1, router3];
    const request2 = [requestParam2, requestParam4];
    const layer2 = [router2, router4];
    const request3 = [requestParam5, requestParam6, requestParam7];
    const layer3 = [router5, router6, router7];

    await dexRouteProxy.connect(alice).mutliSwap(
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
      [request1, request2, request3],
      [layer1, layer2, layer3],
    );
  });

  xit("mixSwap with single path", async function() {
    // wbtc -> weth -> usdt

    console.log("before: " + await weth.balanceOf(alice.address));

    const fromToken = usdt.address;
    const toToken = weth.address;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const fromTokenAmount1 = ethers.utils.parseEther('2');
    const fromTokenAmount2 = ethers.utils.parseEther('5');
    const fromTokenAmount3 = ethers.utils.parseEther('5');
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await usdt.connect(alice).approve(tokenApprove.address, fromTokenAmount);

    // node1
    const requestParam1 = [
      [usdt.address],
      [dot.address],
      [fromTokenAmount]
    ];
    const mixAdapter1 = [
      [uniAdapter.address]
    ];
    const mixPair1 = [
      [lpDOTUSDT.address]
    ];
    const assertTo1 = [
      [lpDOTUSDT.address, dexRouteProxy.address]
    ];
    const weight1 = [[10000]];
    const directions1 = [[direction(usdt.address, dot.address)]];
    const extraData1 = [[0x0]];
    const router1 = [mixAdapter1, mixPair1, assertTo1, weight1, directions1, extraData1];

    // node2
    const requestParam2 = [
      [dot.address, dot.address],
      [weth.address, weth.address],
      [0, 0],
    ];
    const mixAdapter2 = [
      [uniAdapter.address],
      [uniAdapter.address],
    ];
    const mixPair2 = [
      [lpWETHDOT.address],
      [lpWETHDOT.address],
    ];
    const assertTo2 = [
      [lpWETHDOT.address, dexRouteProxy.address],
      [lpWETHDOT.address, dexRouteProxy.address],
    ];
    const weight2 = [[1000], [9000]];
    const directions2 = [[direction(dot.address, weth.address)], [direction(dot.address, weth.address)]];
    const extraData2 = [[0x0], [0x0]];
    const router2 = [mixAdapter2, mixPair2, assertTo2, weight2, directions2, extraData2];
    
    // node3
    const requestParam3 = [
      [weth.address],
      [dot.address],
      [0],
    ];
    const mixAdapter3 = [
      [uniAdapter.address]
    ];
    const mixPair3 = [
      [lpWETHDOT.address]
    ];
    const assertTo3 = [
      [lpWETHDOT.address, dexRouteProxy.address]
    ];
    const weight3 = [[10000]];
    const directions3 = [[0]];
    const extraData3 = [[0x0]];
    const router3 = [mixAdapter3, mixPair3, assertTo3, weight3, directions3, extraData3];

    // layer1
    const request1 = [requestParam1];
    const layer1 = [router1];

    // node4
    const requestParam4 = [
      [wbtc.address],
      [usdt.address],
      [fromTokenAmount],
    ];
    // layer3
    const mixAdapter4 = [
      [uniAdapter.address]
    ];
    const mixPair4 = [
      [lpWBTCUSDT.address]
    ];
    const assertTo4 = [
      [lpWBTCUSDT.address, dexRouteProxy.address]
    ];
    const weight4 = [[5000]];
    const directions4 = [[0]];
    const extraData4 = [[0x0, 0x0]];
    const router4 = [mixAdapter4, mixPair4, assertTo4, weight4, directions4, extraData4];

    // node5
    const requestParam5 = [
      [usdt.address],
      [weth.address],
      [0],
    ];
    // layer3
    const mixAdapter5 = [
      [uniAdapter.address]
    ];
    const mixPair5 = [
      [lpWETHUSDT.address]
    ];
    const assertTo5 = [
      [lpWETHUSDT.address, dexRouteProxy.address]
    ];
    const weight5 = [[10000]];
    const directions5 = [[0]];
    const extraData5 = [[0x0]];
    const router5 = [mixAdapter5, mixPair5, assertTo5, weight5, directions5, extraData5];

    // layer2
    const request2 = [requestParam1, requestParam2];
    const layer2 = [router1, router2];

    await dexRouteProxy.connect(alice).mutliSwap(
      fromToken,
      toToken,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
      [request2],
      [layer2],
    );
    
    // console.log("gasUsed: " + gasUsed)

    // console.log("after: " + await usdc.balanceOf(alice.address) / 1e18);
    // console.log("after: " + await weth.balanceOf(alice.address) / 1e18);

    // console.log("after: " + await usdc.balanceOf(dexRouteProxy.address) / 1e18);
    // console.log("after: " + await weth.balanceOf(dexRouteProxy.address) / 1e18);
    // console.log("after: " + await dot.balanceOf(dexRouteProxy.address) / 1e18);
    // console.log("after: " + await wbtc.balanceOf(dexRouteProxy.address) / 1e18);
  });

  const direction = function(token0, token1) {
    if (token0 > token1) {
      return 0
    } else {
      return 1
    }
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
    await wbtc.transfer(alice.address, ethers.utils.parseEther('10'));
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

  const initSOR = async () => {
    TokenApprove = await ethers.getContractFactory("TokenApprove")
    tokenApprove = await TokenApprove.deploy();
    await tokenApprove.deployed();

    TokenApproveProxy = await ethers.getContractFactory("TokenApproveProxy");
    tokenApproveProxy = await TokenApproveProxy.deploy(tokenApprove.address);
    await tokenApproveProxy.deployed();

    await tokenApprove.init(owner.address, tokenApproveProxy.address);
    
    DexRouteProxy = await ethers.getContractFactory("DexRouteProxy");
    dexRouteProxy = await upgrades.deployProxy(
      DexRouteProxy, 
      [
        weth.address, 
        tokenApproveProxy.address
      ]  
    )
    await dexRouteProxy.deployed();
    await dexRouteProxy.setTokenAprrove(tokenApprove.address);

    await tokenApproveProxy.addProxy(dexRouteProxy.address);

    const WBNB = await ethers.getContractFactory("MockWBNB");
    wbnb = await WBNB.deploy();

    UniAdapter = await ethers.getContractFactory("UniAdapter");
    uniAdapter = await UniAdapter.deploy();

    const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
    factory = await PancakeFactory.deploy(owner.address);
    await factory.deployed();
    const PancakeRouter = await ethers.getContractFactory("PancakeRouter");
    router = await PancakeRouter.deploy(factory.address, wbnb.address);
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
    const PancakePair = await ethers.getContractFactory("PancakePair");

    pair = await factory.getPair(wbtc.address, dot.address)
    lpWBTCDOT = await PancakePair.attach(pair);

    pair = await factory.getPair(dot.address, usdt.address)
    lpDOTUSDT = await PancakePair.attach(pair);

    pair = await factory.getPair(wbtc.address, bnb.address);
    lpWBTCBNB = await PancakePair.attach(pair);

    pair = await factory.getPair(wbtc.address, usdc.address);
    lpWBTCUSDC = await PancakePair.attach(pair);

    pair = await factory.getPair(bnb.address, usdc.address);
    lpBNBUSDC = await PancakePair.attach(pair);

    pair = await factory.getPair(wbtc.address, usdt.address);
    lpWBTCUSDT = await PancakePair.attach(pair);

    pair = await factory.getPair(usdt.address, weth.address);
    lpWETHUSDT = await PancakePair.attach(pair);

    pair = await factory.getPair(dot.address, weth.address);
    lpWETHDOT = await PancakePair.attach(pair);

    pair = await factory.getPair(wbtc.address, weth.address);
    lpWBTCWETH = await PancakePair.attach(pair);

    pair = await factory.getPair(bnb.address, weth.address);
    lpBNBWETH = await PancakePair.attach(pair);
  }
});
