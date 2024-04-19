const { ethers, upgrades, network } = require("hardhat");
const hre = require("hardhat");
const ethDeployed = require("../scripts/deployed/eth");
const { expect } = require('chai');
const pmm_params = require("../dex_router_v2_test/pmm/pmm_params");

require('../scripts/tools');

describe("Smart route path test with commission", function () {
  this.timeout(300000);
  const FOREVER = '2000000000';
  let wbtc, weth, dot, bnb, usdc, usdt, memeToken;
  let router, tokenApprove, dexRouter, wNativeRelayer, tokenApproveProxy;
  let owner, alice, bob, liquidity, ethHolder;

  const feeReceiver = "0x94d3af948652ea2b272870ffa10da3250e0a34c3" // unibot address
  const fee = ethers.BigNumber.from(100).toHexString()
  const commissionFlag = "0x3ca20afc2bbb"
  const commissionInfo = "0x" + commissionFlag.replace('0x', '') + '0000000000' + fee.replace('0x', '') + feeReceiver.replace('0x', '')
  // const commissionInfo = "0x3ca20afc2aaa00000000006494d3af948652ea2b272870ffa10da3250e0a34c3"; // unibot address, with commission fee 100/10000

  before(async () => {
    [owner, alice, bob, liquidity, ethHolder] = await ethers.getSigners();
    tom = { "address": '0xeeeEEEeEeeEeEeeEEeeEeeeEeeEeEEeeeeEeffFf' }
    await setForkBlockNumber(16094434);
    await initWeth();
    await initTokenApproveProxy();
    await initDexRouter();
    await initMockXBridge();
    await initWNativeRelayer();

    await ethHolder.sendTransaction({ to: bob.address, value: ethers.utils.parseEther('4000') });
    await ethHolder.sendTransaction({ to: liquidity.address, value: ethers.utils.parseEther('4000') });
  });

  beforeEach(async () => {
    await initMockTokens();
    await dispatchAsset();
    await initUniswap();

    const pairs = [
      [weth, usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('300000')],
      [wbtc, usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('3000000')],
      [wbtc, weth, ethers.utils.parseEther('1000'), ethers.utils.parseEther('10000')],
      [weth, dot, ethers.utils.parseEther('100'), ethers.utils.parseEther('1000')],
      [dot, usdt, ethers.utils.parseEther('100'), ethers.utils.parseEther('3000')],
      [wbtc, dot, ethers.utils.parseEther('100'), ethers.utils.parseEther('100000')],
      [usdt, usdc, ethers.utils.parseEther('10000'), ethers.utils.parseEther('10000')],
      [bnb, weth, ethers.utils.parseEther('100'), ethers.utils.parseEther('10000')],
      [bnb, wbtc, ethers.utils.parseEther('100'), ethers.utils.parseEther('100000')],
      [memeToken, usdt, ethers.utils.parseEther('1000000'), ethers.utils.parseEther('1000000')],
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

  it("mixSwap with single path with safemoon token with commission", async () => {
    // wbtc -> weth -> usdt

    await memeToken.transfer(alice.address, ethers.utils.parseEther('100000000'));

    fromToken = memeToken;
    toToken = usdt;
    const totalAmount = ethers.utils.parseEther('1000');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.utils.parseEther('1000000'));

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpMemeUSDT.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(memeToken.address, usdt.address, lpMemeUSDT) + "0000000000000000000" + weight1 + lpMemeUSDT.address.replace("0x", "")
    ];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, memeToken.address];

    // layer1
    const layer1 = [router1];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')

    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()

    expect(await toToken.balanceOf(feeReceiver)).to.be.equal("9960069810399032164")
    expect(await toToken.balanceOf(tom.address)).to.be.equal("986046911229504184329")

  });

  it("mixSwap with single path with commission", async () => {
    // wbtc -> weth -> usdt

    fromToken = wbtc;
    toToken = usdt;
    const totalAmount = ethers.utils.parseEther('10');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.utils.parseEther('1000'));

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")
    ];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, fromToken.address];

    // node2
    const mixAdapter2 = [
      uniAdapter.address
    ];
    const assertTo2 = [
      lpWETHUSDT.address
    ];
    const weight2 = getWeight(10000);
    const rawData2 = [
      "0x" + await direction(weth.address, usdt.address, lpWETHUSDT) + "0000000000000000000" + weight2 + lpWETHUSDT.address.replace("0x", "")
    ];
    const extraData2 = [0x0];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2, weth.address];

    // layer1
    const layer1 = [router1, router2];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()

    // reveiveAmount = fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997);
    // wbtc -> weth 1:10
    // 10000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  10000000000000000000 * 997) = 98715803439706130000
    const receive0 = getAmountOut(totalAmount, '10000000000000000000000', '1000000000000000000000');
    // weth -> usdt 1:3000
    // 98715803439706130000 * 997 * 300000000000000000000000 / (100000000000000000000 * 1000 +  98715803439706130000 * 997) = 148805301851965514608651
    const receive1 = getAmountOut(receive0, '300000000000000000000000', '100000000000000000000');
    expect(await usdt.balanceOf(tom.address)).to.be.eq("147317248833445859462565");
    expect(await usdt.balanceOf(feeReceiver)).to.be.eq("1488053018519655146086");

  });

  it("mixSwap with two fork path with commission", async () => {
    // wbtc -> weth -> usdt
    //      -> dot  -> usdt

    const fromToken = wbtc;
    const toToken = usdt;
    const totalAmount = ethers.utils.parseEther('10');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)

    const fromTokenAmount1 = totalAmount.div(2);
    const fromTokenAmount2 = totalAmount.div(2);
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ]
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")
    ];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, wbtc.address];

    // node1-1
    const mixAdapter3 = [
      uniAdapter.address,
    ];
    const assertTo3 = [
      lpWETHUSDT.address,
    ];
    const weight3 = getWeight(10000);
    const rawData3 = [
      "0x" + await direction(weth.address, usdt.address, lpWETHUSDT) + "0000000000000000000" + weight3 + lpWETHUSDT.address.replace("0x", "")
    ];
    const extraData3 = [0x0];
    const router3 = [mixAdapter3, assertTo3, rawData3, extraData3, weth.address];

    // node2
    const mixAdapter2 = [
      uniAdapter.address,
    ];
    const assertTo2 = [
      lpWBTCDOT.address,
    ];
    const weight2 = getWeight(10000);
    const rawData2 = [
      "0x" + await direction(wbtc.address, dot.address, lpWBTCDOT) + "0000000000000000000" + weight2 + lpWBTCDOT.address.replace("0x", "")
    ];
    const extraData2 = ['0x'];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2, wbtc.address];

    // node2-1
    const mixAdapter4 = [
      uniAdapter.address,
    ];
    const assertTo4 = [
      lpDOTUSDT.address,
    ];
    const weight4 = '2710'; // Number(10000).toString(16).replace('0x', '');
    const rawData4 = [
      "0x" + await direction(dot.address, usdt.address, lpDOTUSDT) + "0000000000000000000" + weight4 + lpDOTUSDT.address.replace("0x", "")
    ];
    const extraData4 = [0x0];
    const router4 = [mixAdapter4, assertTo4, rawData4, extraData4, dot.address];

    // layer1
    const layer1 = [router1, router3];
    const layer2 = [router2, router4];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [fromTokenAmount1, fromTokenAmount2],
      [layer1, layer2],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()
    // console.log(rxResult.data)
    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    // wbtc -> weth
    // 5000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  5000000000000000000 * 997) = 49602730389010784000
    const receive0 = getAmountOut(fromTokenAmount1, '10000000000000000000000', '1000000000000000000000');
    // weth -> usdt
    // 49602730389010784000 * 997 * 300000000000000000000000 / (100000000000000000000 * 1000 +  49602730389010784000 * 997) = 9.926923590344674e+22
    const receive00 = getAmountOut(receive0, '300000000000000000000000', '100000000000000000000');
    // wbtc -> dot
    // 5000000000000000000 * 997 * 100000000000000000000000 / (100000000000000000000 * 1000 +  5000000000000000000 * 997) = 4748297375815592703719
    const receive1 = getAmountOut(fromTokenAmount2, '100000000000000000000000', '100000000000000000000');
    // dot -> usdt
    // 4748297375815592703719 * 997 * 3000000000000000000000 / (100000000000000000000 * 1000 +  4748297375815592703719 * 997) = 2.937940268333389e+21
    const receive11 = getAmountOut(receive1, '3000000000000000000000', '100000000000000000000');
    // usdt: 9.926923590344674e+22 + 2.937940268333389e+21 = 10220717617178012e+23 (102207176171780117650753)
    const receive = receive00.add(receive11);
    expect(await usdt.balanceOf(tom.address)).to.be.eq("101185104410062316474246");
    expect(await usdt.balanceOf(feeReceiver)).to.be.eq("1022071761717801176507");

  });

  it("mixSwap with four path, same token with commission", async () => {
    // wbtc -> weth(uni)
    //      -> weth(curve)
    //      -> weth(dodo)

    expect(await weth.balanceOf(alice.address)).to.be.eq("0");
    expect(await wbtc.balanceOf(alice.address)).to.be.eq("100000000000000000000");

    fromToken = wbtc;
    toToken = weth;
    const totalAmount = ethers.utils.parseEther('10');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)

    minReturnAmount = 0;
    deadLine = FOREVER;

    await wbtc.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    // node1
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
    const weight1 = getWeight(2000);
    const weight2 = getWeight(3000);
    const weight3 = getWeight(5000);
    const rawData1 = [
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", ""),
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight2 + lpWBTCWETH.address.replace("0x", ""),
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight3 + lpWBTCWETH.address.replace("0x", ""),
    ];
    const extraData1 = ['0x', '0x', '0x'];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, wbtc.address];

    // layer1
    const layer1 = [router1];

    baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()


    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    expect(await toToken.balanceOf(feeReceiver)).to.be.eq("987148975726274376")
    expect(await weth.balanceOf(tom.address)).to.be.eq("97727748596901163290");

  });

  it("mixSwap with three fork path with commission", async () => {
    //       -> weth -> usdt
    //  wbtc -> dot  -> usdt
    //       -> bnb  -> weth -> usdt
    //               -> weth -> usdt

    const fromToken = wbtc;
    const toToken = usdt;

    const fromTokenAmount = ethers.utils.parseEther('10')
    const fromTokenAmount1 = ethers.utils.parseEther('2');
    const fromTokenAmount2 = ethers.utils.parseEther('3');
    const fromTokenAmount3 = ethers.utils.parseEther('5');
    const totalAmount = fromTokenAmount
    // const commissionAmount = totalAmount.mul(fee).div(10000)

    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);

    expect(await toToken.balanceOf(alice.address)).to.be.eq("0");

    // wbtc -> weth
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")
    ];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, wbtc.address];

    // weth -> usdt
    const mixAdapter3 = [
      uniAdapter.address,
    ];
    const assertTo3 = [
      lpWETHUSDT.address,
    ];
    const weight3 = getWeight(10000);
    const rawData3 = ["0x" + await direction(weth.address, usdt.address, lpWETHUSDT) + "0000000000000000000" + weight3 + lpWETHUSDT.address.replace("0x", "")];
    const extraData3 = [0x0];
    const router3 = [mixAdapter3, assertTo3, rawData3, extraData3, weth.address];

    // wbtc -> dot
    const mixAdapter2 = [
      uniAdapter.address,
    ];
    const assertTo2 = [
      lpWBTCDOT.address,
    ];
    const weight2 = getWeight(10000);
    const rawData2 = [
      "0x" + await direction(wbtc.address, dot.address, lpWBTCDOT) + "0000000000000000000" + weight2 + lpWBTCDOT.address.replace("0x", "")
    ];
    const extraData2 = [0x0];
    const router2 = [mixAdapter2, assertTo2, rawData2, extraData2, wbtc.address];

    // dot -> usdt
    const mixAdapter4 = [
      uniAdapter.address,
    ];
    const assertTo4 = [
      lpDOTUSDT.address
    ];
    const weight4 = getWeight(10000);
    const rawData4 = [
      "0x" + await direction(dot.address, usdt.address, lpDOTUSDT) + "0000000000000000000" + weight4 + lpDOTUSDT.address.replace("0x", "")
    ];
    const extraData4 = [0x0];
    const router4 = [mixAdapter4, assertTo4, rawData4, extraData4, dot.address];

    // wbtc -> bnb
    const mixAdapter5 = [
      uniAdapter.address
    ];
    const assertTo5 = [
      lpWBTCBNB.address
    ];
    const weight5 = getWeight(10000);
    const rawData5 = [
      "0x" + await direction(wbtc.address, bnb.address, lpWBTCBNB) + "0000000000000000000" + weight5 + lpWBTCBNB.address.replace("0x", "")
    ];
    const extraData5 = [0x0];
    const router5 = [mixAdapter5, assertTo5, rawData5, extraData5, wbtc.address];

    // bnb -> weth
    const mixAdapter6 = [
      uniAdapter.address,
      uniAdapter.address,
    ];
    const assertTo6 = [
      lpBNBWETH.address,
      lpBNBWETH.address
    ];
    const weight61 = getWeight(8000);
    const weight62 = getWeight(2000);
    const rawData6 = [
      "0x" + await direction(bnb.address, weth.address, lpBNBWETH) + "0000000000000000000" + weight61 + lpBNBWETH.address.replace("0x", ""),
      "0x" + await direction(bnb.address, weth.address, lpBNBWETH) + "0000000000000000000" + weight62 + lpBNBWETH.address.replace("0x", "")
    ];
    const extraData6 = [0x0, 0x0];
    const router6 = [mixAdapter6, assertTo6, rawData6, extraData6, bnb.address];

    // weth -> usdt
    const mixAdapter7 = [
      uniAdapter.address,
      uniAdapter.address,
    ];
    const assertTo7 = [
      lpWETHUSDT.address,
      lpWETHUSDT.address
    ];
    const weight70 = getWeight(5000);
    const weight71 = getWeight(5000);
    const rawData7 = [
      "0x" + await direction(weth.address, usdt.address, lpWETHUSDT) + "0000000000000000000" + weight70 + lpWETHUSDT.address.replace("0x", ""),
      "0x" + await direction(weth.address, usdt.address, lpWETHUSDT) + "0000000000000000000" + weight71 + lpWETHUSDT.address.replace("0x", "")
    ];
    const extraData7 = [0x0, 0x0];
    const router7 = [mixAdapter7, assertTo7, rawData7, extraData7, weth.address];

    // layer1
    const layer1 = [router1, router3];
    const layer2 = [router2, router4];
    const layer3 = [router5, router6, router7];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [fromTokenAmount1, fromTokenAmount2, fromTokenAmount3],
      [layer1, layer2, layer3],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()

    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    expect(await toToken.balanceOf(tom.address)).to.be.eq("53061572767792519391137");
    expect(await toToken.balanceOf(feeReceiver)).to.be.eq("535975482502954741324")
  });

  it("mixSwap with single path and source token is native token with commission", async () => {
    expect(await dexRouter._WETH()).to.be.equal(weth.address);
    // ETH -> WBTC
    ETH = { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }

    fromToken = ETH;
    toToken = wbtc;
    const fromTokenAmount = ethers.utils.parseEther('10');
    const totalAmount = fromTokenAmount.mul(ethers.BigNumber.from(10000)).div(ethers.BigNumber.from(10000).sub(fee))
    const commissionAmount = totalAmount.mul(fee).div(10000)

    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    const beforeToTokenBalance = await toToken.balanceOf(alice.address);

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = '2710'; // Number(10000).toString(16).replace('0x', '');
    const rawData1 = [
      "0x" + await direction(weth.address, wbtc.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = ['0x'];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, weth.address];

    // layer1
    const layer1 = [router1];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      fromTokenAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [fromTokenAmount],
      [layer1],
      [],
      {
        value: totalAmount
      }
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()

    // reveiveAmount = fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997);
    // wbtc -> weth 1:10
    // 10000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  10000000000000000000 * 997) = 98715803439706130000
    const receive0 = getAmountOut(fromTokenAmount, '1000000000000000000000', '10000000000000000000000');
    expect(await toToken.balanceOf(tom.address)).to.be.eq("986046911229504184");
    expect(await ethers.provider.getBalance(feeReceiver)).to.be.eq("0")
  });

  it("mixSwap with single path and target token is native token with commission", async () => {
    expect(await dexRouter._WETH()).to.be.equal(weth.address);

    // wbtc -> eth
    ETH = { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }

    fromToken = wbtc;
    toToken = ETH;
    const totalAmount = ethers.utils.parseEther('10');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)

    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.constants.MaxUint256);
    const beforeAliceBalance = await ethers.provider.getBalance(alice.address);

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(wbtc.address, weth.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = ['0x'];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, wbtc.address];

    // layer1
    const layer1 = [router1];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()

    // reveiveAmount = fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997);
    // wbtc -> weth 1:10
    // 10000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  10000000000000000000 * 997) = 98715803439706130000
    // const receiveAmount = getAmountOut(fromTokenAmount, '10000000000000000000000', '1000000000000000000000');
    // const gasCost = await getTransactionCost(tx);
    // const finalAmount = beforeAliceBalance.sub(gasCost).add(receiveAmount);
    expect(await ethers.provider.getBalance(tom.address)).to.be.eq("97728645405309068588");
    expect(await ethers.provider.getBalance(feeReceiver)).to.be.eq("987158034397061298")
  });

  it("mixSwap with single path and source token is wrapped native token with commission", async () => {
    expect(await dexRouter._WETH()).to.be.equal(weth.address);
    setBalance(alice.address, ethers.utils.parseEther('1100000'));
    await weth.connect(alice).deposit({ value: ethers.utils.parseEther('1000000') });
    // WETH -> WBTC
    fromToken = weth;
    toToken = wbtc;
    const totalAmount = ethers.utils.parseEther('10');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    const beforeToTokenBalance = await toToken.balanceOf(alice.address);

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpWBTCWETH.address
    ];
    const weight1 = '2710'; // Number(10000).toString(16).replace('0x', '');
    const rawData1 = [
      "0x" + await direction(weth.address, wbtc.address, lpWBTCWETH) + "0000000000000000000" + weight1 + lpWBTCWETH.address.replace("0x", "")];
    const extraData1 = ['0x'];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, weth.address];

    // layer1
    const layer1 = [router1];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    await fromToken.connect(alice).approve(tokenApprove.address, ethers.utils.parseEther('1000'));
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()
    // reveiveAmount = fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997);
    // wbtc -> weth 1:10
    // 10000000000000000000 * 997 * 10000000000000000000000 / (1000000000000000000000 * 1000 +  10000000000000000000 * 997) = 98715803439706130000
    const receive0 = getAmountOut(totalAmount, '1000000000000000000000', '10000000000000000000000');
    expect(await toToken.balanceOf(tom.address)).to.be.eq("986046911229504184");
    expect(await toToken.balanceOf(feeReceiver)).to.be.eq("9960069810399032")
  });


  it("mixSwap with single path with order id with commission", async () => {
    // wbtc -> weth -> usdt

    await memeToken.transfer(alice.address, ethers.utils.parseEther('100000000'));

    fromToken = memeToken;
    toToken = usdt;
    const totalAmount = ethers.utils.parseEther('1000');
    // const commissionAmount = totalAmount.mul(fee).div(10000)
    // const fromTokenAmount = totalAmount.sub(commissionAmount)
    const minReturnAmount = ethers.utils.parseEther('0');
    const deadLine = FOREVER;

    await fromToken.connect(alice).approve(tokenApprove.address, ethers.utils.parseEther('1000000'));

    // node1
    const mixAdapter1 = [
      uniAdapter.address
    ];
    const assertTo1 = [
      lpMemeUSDT.address
    ];
    const weight1 = getWeight(10000);
    const rawData1 = [
      "0x" + await direction(memeToken.address, usdt.address, lpMemeUSDT) + "0000000000000000000" + weight1 + lpMemeUSDT.address.replace("0x", "")
    ];
    const extraData1 = [0x0];
    const router1 = [mixAdapter1, assertTo1, rawData1, extraData1, memeToken.address];

    // layer1
    const layer1 = [router1];

    const baseRequest = [
      fromToken.address,
      toToken.address,
      totalAmount,
      minReturnAmount,
      deadLine,
    ]
    const orderId = 1;
    let rawInfo = await dexRouter.connect(alice).populateTransaction.smartSwapTo(
      orderId,
      tom.address,
      baseRequest,
      [totalAmount],
      [layer1],
      []
    );
    let commissionToken = "000000000000000000000000" + toToken.address.toString().replace('0x', '')
    rawInfo.data = rawInfo.data + commissionToken + commissionInfo.replace('0x', '')
    let tx = await alice.sendTransaction(rawInfo)
    let receipt = await tx.wait()
    const iface = new ethers.utils.Interface(["event SwapOrderId(uint256 id)"]);
    expect(receipt.logs[0].topics[0]).to.be.equal(iface.getEventTopic("SwapOrderId(uint256)"))
    expect(await toToken.balanceOf(dexRouter.address)).to.be.eq("0");
    expect(await toToken.balanceOf(tom.address)).to.be.eq("986046911229504184329")
    expect(await toToken.balanceOf(feeReceiver)).to.be.eq("9960069810399032164")
  });



  const direction = async (fromToken, toToken, pair) => {
    if (!pair) return 0;
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    if (fromToken === token0 && toToken === token1) {
      return 0;
    } else {
      return 8;
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

    wbtc = await MockERC20.deploy('WBTC', 'WBTC', ethers.utils.parseEther('10000000000'));
    await wbtc.deployed();

    dot = await MockERC20.deploy('DOT', 'DOT', ethers.utils.parseEther('10000000000'));
    await dot.deployed();

    bnb = await MockERC20.deploy('BNB', 'BNB', ethers.utils.parseEther('10000000000'));
    await bnb.deployed();

    usdc = await MockERC20.deploy('USDC', 'USDC', ethers.utils.parseEther('10000000000'));
    await usdc.deployed();

    const MEMEERC20 = await ethers.getContractFactory("CustomERC20");
    memeToken = await MEMEERC20.deploy(
      owner.address,
      ethers.utils.parseEther('10000000000'),
      'YYDS',
      'YYDS',
      18,
      100,
      10,
      liquidity.address,
      false
    );
    await memeToken.deployed();
  }

  const dispatchAsset = async () => {
    await usdt.transfer(alice.address, ethers.utils.parseEther('0'));
    await usdt.transfer(bob.address, ethers.utils.parseEther('100000000'));

    await wbtc.transfer(alice.address, ethers.utils.parseEther('100'));
    await wbtc.transfer(bob.address, ethers.utils.parseEther('100000000'));

    await dot.transfer(alice.address, ethers.utils.parseEther('0'));
    await dot.transfer(bob.address, ethers.utils.parseEther('100000000'));

    await bnb.transfer(alice.address, ethers.utils.parseEther('100'));
    await bnb.transfer(bob.address, ethers.utils.parseEther('100000000'));

    await usdc.transfer(alice.address, ethers.utils.parseEther('0'));
    await usdc.transfer(bob.address, ethers.utils.parseEther('100000000'));

    await weth.connect(bob).deposit({ value: ethers.utils.parseEther('1000') });

    await weth.mint(bob.address, ethers.utils.parseEther('100000000'));

    await memeToken.connect(owner).transfer(bob.address, ethers.utils.parseEther('2000000'));
  }

  const initUniswap = async () => {
    UniAdapter = await ethers.getContractFactory("UniAdapter");
    uniAdapter = await UniAdapter.deploy();

    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(owner.address);
    await factory.deployed();
    const UniswapV2Router = await ethers.getContractFactory("UniswapRouter");
    router = await UniswapV2Router.deploy(factory.address, weth.address);
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
    await factory.createPair(memeToken.address, usdt.address);
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

    pair = await factory.getPair(memeToken.address, usdt.address);
    lpMemeUSDT = await UniswapPair.attach(pair);
  }


  const initWeth = async () => {
    weth = await ethers.getContractAt(
      "WETH9",
      ethDeployed.tokens.weth
    );
    setBalance(bob.address, ethers.utils.parseEther('1100000'));
    await weth.connect(bob).deposit({ value: ethers.utils.parseEther('1000000') });
  }

  const initTokenApproveProxy = async () => {
    tokenApproveProxy = await ethers.getContractAt(
      "TokenApproveProxy",
      ethDeployed.base.tokenApproveProxy

    );
    tokenApprove = await ethers.getContractAt(
      "TokenApprove",
      ethDeployed.base.tokenApprove

    );
  }

  const initDexRouter = async () => {
    let _feeRateAndReceiver = "0x000000000000000000000000" + pmm_params.feeTo.slice(2);
    DexRouter = await ethers.getContractFactory("DexRouter");
    dexRouter = await upgrades.deployProxy(DexRouter);
    await dexRouter.deployed();
    //await dexRouter.initializePMMRouter(_feeRateAndReceiver);


    expect(await dexRouter._WETH()).to.be.equal(weth.address);
    expect(await dexRouter._APPROVE_PROXY()).to.be.equal(tokenApproveProxy.address);

    // await dexRouter.setApproveProxy(tokenApproveProxy.address);


    let accountAddress = await tokenApproveProxy.owner();
    startMockAccount([accountAddress]);
    tokenApproveProxyOwner = await ethers.getSigner(accountAddress);
    setBalance(tokenApproveProxyOwner.address, '0x56bc75e2d63100000');

    await tokenApproveProxy.connect(tokenApproveProxyOwner).addProxy(dexRouter.address);
    await tokenApproveProxy.connect(tokenApproveProxyOwner).setTokenApprove(tokenApprove.address);
  }

  const initWNativeRelayer = async () => {
    wNativeRelayer = await ethers.getContractAt(
      "WNativeRelayer",
      ethDeployed.base.wNativeRelayer

    );
    let accountAddress = await wNativeRelayer.owner();
    startMockAccount([accountAddress]);
    wNativeRelayerOwner = await ethers.getSigner(accountAddress);
    setBalance(wNativeRelayerOwner.address, '0x56bc75e2d63100000');
    await wNativeRelayer.connect(wNativeRelayerOwner).setCallerOk([dexRouter.address], [true]);
    // await dexRouter.setWNativeRelayer(wNativeRelayer.address);


    expect(await dexRouter._WNATIVE_RELAY()).to.be.equal(wNativeRelayer.address);
  }

  // const initDexRouter = async () => {
  //   TokenApproveProxy = await ethers.getContractFactory("TokenApproveProxy");
  //   tokenApproveProxy = await TokenApproveProxy.deploy();
  //   await tokenApproveProxy.initialize();
  //   await tokenApproveProxy.deployed();

  //   TokenApprove = await ethers.getContractFactory("TokenApprove");
  //   tokenApprove = await TokenApprove.deploy();
  //   await tokenApprove.initialize(tokenApproveProxy.address);
  //   await tokenApprove.deployed();

  //   DexRouter = await ethers.getContractFactory("DexRouter");
  //   dexRouter = await upgrades.deployProxy(DexRouter, [])
  //   await dexRouter.deployed();
  //   await dexRouter.setApproveProxy(tokenApproveProxy.address);

  //   await tokenApproveProxy.addProxy(dexRouter.address);
  //   await tokenApproveProxy.setTokenApprove(tokenApprove.address);

  //   await wNativeRelayer.setCallerOk([dexRouter.address], [true]);
  // }

  const initMockXBridge = async () => {
    const XBridgeMock = await ethers.getContractFactory("MockXBridge");
    let xBridge = await upgrades.deployProxy(XBridgeMock);
    await xBridge.deployed();
    await xBridge.setDexRouter(dexRouter.address);
    await dexRouter.setPriorityAddress(xBridge.address, true);
    await xBridge.connect(owner).setMpc([alice.address], [true]);
    await xBridge.setApproveProxy(tokenApproveProxy.address);
    return xBridge;
  }

  const getWeight = function (weight) {
    return ethers.utils.hexZeroPad(weight, 2).replace('0x', '');
  }

  // fromTokenAmount * 997 * r0 / (r1 * 1000 + fromTokenAmount * 997)
  const getAmountOut = function (amountIn, r0, r1) {
    return ethers.BigNumber.from(amountIn.toString())
      .mul(ethers.BigNumber.from('997'))
      .mul(ethers.BigNumber.from(r0))
      .div(
        ethers.BigNumber.from(r1)
          .mul(ethers.BigNumber.from('1000'))
          .add(ethers.BigNumber.from(amountIn.toString()).mul(ethers.BigNumber.from('997')))
      );
  }

  const getTransactionCost = async (txResult) => {
    const cumulativeGasUsed = (await txResult.wait()).cumulativeGasUsed;
    return ethers.BigNumber.from(txResult.gasPrice).mul(ethers.BigNumber.from(cumulativeGasUsed));
  };
});