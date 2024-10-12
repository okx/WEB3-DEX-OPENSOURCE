// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/test.sol";
import "forge-std/console2.sol";
import "@dex/adapter/SolidlyV3Adapter.sol";

contract Deploy is Test {
    address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));

    function run() public {
        require(deployer == 0x399EfA78cAcD7784751CD9FBf2523eDf9EFDf6Ad, "wrong deployer! change the private key");

        // deploy on ARBchain
        vm.createSelectFork(vm.envString("ARB_RPC_URL"));
        vm.startBroadcast(deployer);

        console2.log("block.chainID", block.chainid);
        require(block.chainid == 42161 , "must be ARB");
      
        address adapter = address(new SolidlyV3Adapter());
        console2.log("SolidlyV3Adapter deployed on ARB: %s", adapter);

        vm.stopBroadcast();
    }
}
