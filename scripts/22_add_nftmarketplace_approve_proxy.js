const { ethers } = require("hardhat");
const deployed = require('./deployed');

async function main() {
  console.log(deployed);

  const tokenApproveProxy = await ethers.getContractAt(
    "TokenApproveProxy",
    deployed.base.tokenApproveProxy
  )

  const nftmarketplace = deployed.base.nftmarketplace;
  let isProxy = await tokenApproveProxy.allowedApprove(nftmarketplace);
  if (!isProxy) {
    let result = await tokenApproveProxy.addProxy(nftmarketplace);
    console.log(`## Add proxy:[%s] txHash:[%s]`, nftmarketplace, result.hash);
  } else {
    console.log(`## Skip add proxy:[%s]`, nftmarketplace);
  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
