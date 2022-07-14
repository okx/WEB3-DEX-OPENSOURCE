const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const { network } = require("hardhat");
const hre = require("hardhat");



setForkBlockNumber = async (targetBlockNumber) => {
    await network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: {
                    jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
                    blockNumber: targetBlockNumber,
                },
            },
        ],
    });
}

startMockAccount = async (account) => {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: account,
    });
}

stopMockAccount = async (account) => {
    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: account,
    });
}

setBalance = async (user, amount) => {
    await network.provider.send("hardhat_setBalance", [
        user,
        amount,
    ]);
}

setNonce = async (user, nonce) => {
    await network.provider.send("hardhat_setNonce", [
        user,
        nonce,
    ]);
}

setNextBlockTimeStamp = async (timestamp) => {
    await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
}

module.exports = {
    setForkBlockNumber,
    startMockAccount,
    stopMockAccount,
    setBalance,
    setNonce,
    setNextBlockTimeStamp
}