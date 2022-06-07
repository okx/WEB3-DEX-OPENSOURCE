const { ethers } = require('hardhat')
const { expect } = require('chai');
require("../scripts/tools");

describe("Smart route path test by calldata", function() {

  const FOREVER = '2000000000';
  let router, tokenApprove, dexRouter, wNativeRelayer, tokenApproveProxy;
  let account;

  before(async () => {
    const WETH9 = await ethers.getContractFactory("WETH9");
    weth = await WETH9.deploy();

    WNativeRelayer = await ethers.getContractFactory("WNativeRelayer");
    wNativeRelayer = await WNativeRelayer.deploy();
    await wNativeRelayer.deployed();
    await wNativeRelayer.initialize(weth.address);
  });

  beforeEach(async () => {

    await setForkBlockNumber(14874123);
    const block = await ethers.provider.getBlock(14874123);

    await setNextBlockTimeStamp(block.timestamp + 60);

    const accountAddress = "0x55FE002aefF02F77364de339a1292923A15844B8";
    await startMockAccount([accountAddress]);
    account = await ethers.getSigner(accountAddress);
    // [owner, alice, bob, liquidity] = await ethers.getSigners();

    await initDexRouter();
  });

  // {
  //   "error": "RuntimeError: VM Exception while processing transaction: revert",
  //   "inputToken": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  //   "outputToken": "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
  //   "inputAmount": "10000000000000",
  //   "blockNumber": 14874123,
  //   "chainId": 0,
  // }

  it("test unidata", async() => {

    fromToken = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    toToken = "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c";
    // fromTokenAmount = "10000000000000";

    console.log("test 1");

    // check BalanceOf 
    InputToken = await ethers.getContractAt(
        "MockERC20",
        fromToken
      );
    OutputToken = await ethers.getContractAt(
        "MockERC20",
        toToken
      );

    console.log("before InputToken Balance: " + await InputToken.balanceOf(account.address));
    console.log("before OutputToken Balance: " + await OutputToken.balanceOf(account.address));
    console.log("dex router address: ", dexRouter.address);


    // await InputToken.connect(account).approve(tokenApprove.address, ethers.constants.MaxUint256);
    await InputToken.connect(account).approve(tokenApprove.address, await InputToken.balanceOf(account.address));

    const calldata = "0xce8c4316000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000001f573d6fb3f13d689ff844b4ce37794d79a7ff1c000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062951b20000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000500918bd8000000000000000000000000000000000000000000000000000000015d3ef798000000000000000000000000000000000000000000000000000000015d3ef798000000000000000000000000000000000000000000000000000000015d3ef798000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000007c00000000000000000000000000000000000000000000000000000000000000f2000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000000000000000000000000000000000000000052000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c000000000000000000000000000000000000000000000000000000000000000010000000000000000000027103416cf6c708da44db2624d63ea0aaef7113527c60000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000b2dc2da9684dfef77cfa5c6bb07e7330237152920000000000000000000000000000000000000000000000000000000000000001000000000000000000000000b2dc2da9684dfef77cfa5c6bb07e7330237152920000000000000000000000000000000000000000000000000000000000000001000000000000000000002710d51a44d3fae010294c616388b506acda1bfaae46000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c5990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001600000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c5990000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001800000000000000000002710cba47689202d31575bfa204efe70e2c83d29da4d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c5990000000000000000000000001f573d6fb3f13d689ff844b4ce37794d79a7ff1c0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000000000000000000000000000000000000000054000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c000000000000000000000000000000000000000000000000000000000000000018000000000000000000027105777d92f208679db4b9778590fa3cab3ac9e21680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001600000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000047b5bc2c49ad25dfa6d7363c5e9b28ef804e1185000000000000000000000000000000000000000000000000000000000000000100000000000000000000000047b5bc2c49ad25dfa6d7363c5e9b28ef804e11850000000000000000000000000000000000000000000000000000000000000001000000000000000000002710bebc44782c7db0a1a60cb6fe97d0b483032ff1c70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f7000000000000000000000000000000000000000000000000000000000000000180000000000000000000271079d89b87468a59b9895b31e3a373dc5973d60065000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000001f573d6fb3f13d689ff844b4ce37794d79a7ff1c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000003f911aedc25c770e701b8f563e8102cfacd62c000000000000000000000000000000000000000000000000000000000000000018000000000000000000027106c6bc977e13df9b0de53b251522280bb723837000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001600000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001800000000000000000002710ab7ae646063087317c1f410c6661364779f87d730000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000001f573d6fb3f13d689ff844b4ce37794d79a7ff1c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf1840d0db54357287cf0736a1426ea93321b0f7000000000000000000000000000000000000000000000000000000000000000100000000000000000000271023d1b2755d6c243dfa9dd06624f1686b9c9e13eb000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000001f573d6fb3f13d689ff844b4ce37794d79a7ff1c0000000000000000000000000000000000000000000000000000000000000000";

    tx = {
        "from": account.address,
        "to": dexRouter.address,
        "data": calldata,
        "gasLimit": 80000000
    }
    
    const txRes = await account.sendTransaction({ ...tx });
    console.log(txRes)

    console.log("after InputToken Balance: " + await InputToken.balanceOf(account.address));
    console.log("after OutputToken Balance: " + await OutputToken.balanceOf(account.address));
    
  });


  const initDexRouter = async () => {
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
      DexRouter
    )
    await dexRouter.deployed();
    await dexRouter.setApproveProxy(tokenApproveProxy.address);

    await tokenApproveProxy.addProxy(dexRouter.address);
    await tokenApproveProxy.setTokenApprove(tokenApprove.address);

    await wNativeRelayer.setCallerOk([dexRouter.address], [true]);
  }

});
