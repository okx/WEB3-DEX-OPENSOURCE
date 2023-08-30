// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/test.sol";
import "forge-std/console2.sol";

import "@dex/adapter/SolidlyseriesAdapter.sol";

contract Deploy is Test {
    address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));

    function run() public {
        console2.log("deployer", deployer);
        require(
            deployer == 0x399EfA78cAcD7784751CD9FBf2523eDf9EFDf6Ad,
            "wrong deployer! change the private key"
        );

        // deploy on mainnet
        vm.createSelectFork(vm.envString("OP_RPC_URL"));
        vm.startBroadcast(deployer);
        console2.log("block.chainID", block.chainid);
        require(block.chainid == 10, "must be mainnet");
        address adapter = address(new SolidlyseriesAdapter());
        console2.log("velodrom deployed: %s", adapter);
        vm.stopBroadcast();
    }
}