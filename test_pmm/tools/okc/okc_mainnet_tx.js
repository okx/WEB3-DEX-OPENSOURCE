/*
** 功能：
** 1. 使用外部 calldata 通过 call 方法查询 evm 执行结果
** 2. 使用外部 calldata 向okc主网的 合约发起交易
** 3. 查询历史交易事件
**
** 注意：
** 1. 检查节点状态是否正常
** 2. 环境变量配置私钥
** 3. 根据需要修改 msg.value
**
** 
*/

const { ethers, network } = require("hardhat");
const hre = require("hardhat");
const okcdevDeployed = require("../../../scripts/deployed/okc_dev");

// let url = "https://exchainrpc.okex.org";
let url = "http://35.73.164.192:26659";
// let url = "https://okc-mainnet.gateway.pokt.network/v1/lb/6275309bea1b320039c893ff";
let provider = new ethers.providers.JsonRpcProvider(url);

let private = process.env.PRIVATE_KEY;  // okc test account
let alice = new ethers.Wallet(private, provider);


async function main() {
    dexRouter = await ethers.getContractAt(
      "DexRouter",
      okcdevDeployed.base.dexRouter
    );

    tokenApprove = await ethers.getContractAt(
      "TokenApprove",
      okcdevDeployed.base.tokenApprove
    );

    uniAdapter = await ethers.getContractAt(
      "UniAdapter",
      okcdevDeployed.adapter.uniV2
    );

    marketMaker = await ethers.getContractAt(
      "MarketMaker",
      okcdevDeployed.base.marketMaker
    );

    pmmAdapter = await ethers.getContractAt(
      "PMMAdapter",
      okcdevDeployed.base.pmmAdapter
    );
    
    usdt = await ethers.getContractAt(
      "MockERC20",
      okcdevDeployed.tokens.usdt
    );

    let calldata = '0x238105e30000000000000000000000000000000000000000000000000000000000000020000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000382bb369d343125bfb2117af9c149795c6c65c500000000000000000000000001a23c4272309cffdd29ce043990e96f0b37c7063000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000890000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000006d14d002728e04dc0000000000000000000000000000000000000000000000006d14d002728e04dc000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000f390830df829cf22c53c8840554b98eafc5dcbc20000000000000000000000000dcb0cb0120d355cde1ce56040be57add0185baa0000000000000000000000000000000000000000000000000000000000000424e051c6e8800000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000382bb369d343125bfb2117af9c149795c6c65c500000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000006bbc3306035784dc0000000000000000000000000000000000000000000000000000000062c26ed60000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000002372474e53500000000000000000000000000032fe03fbdaf63c8151a9ea3802969321a81ab17b0000000000000000000000008f8526dbfd6e38e3d8307702ca8469bae6c56c15000000000000000000000000382bb369d343125bfb2117af9c149795c6c65c500000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000e44a23d81b2d00000000000000000000000000000000000000000000000000000000000062c25e190000000000000000000000000000000000000000000000000000000062c288490000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000004d8d82f269a2704867b6caf58d6e8389e3066ec9000000000000000000000000000000000000000000000000000022cbcb4b4ad489a20592dd9d49dbb8270b09a84617e0a963b6cd0921de075de9c8bf7fcb319713487adc882617b7cdd1721eb1e20dd91b11a3cf7bc469d2530553918baa7ea20d1261d0d1af0a43407745c6b49133375d77a4b31a7ceb13fd05e5093ed71c99b644ca9055f57ce47633d1fb4a2be92e2bf8c0c92f33dd8e526b813c5f0ea5df000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    let transaction = {
        to: dexRouter.address,
        data: calldata,
        gasLimit: 10000000,
        // value: ethers.utils.parseEther('0.0001')
    }

    // 1. 通过 call 方法查询evm执行结果
    let res = await alice.call(transaction);
    console.log("res",res);

    // 2. 发送交易上链
    // let res = await alice.sendTransaction(transaction);
    // let receipt = await res.wait();
    // console.log("receipt", receipt);


    // 3. 查询交易事件
    // let receipt = await provider.getTransactionReceipt("0xE02EF6223224C6902CA1E0BF4C2C05C4CA6E6BF5269B6A48451AC7392340F392");
    // console.log("receipt",receipt.log);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });



  
  

  