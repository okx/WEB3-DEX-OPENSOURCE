// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console2} from "forge-std/Script.sol";
import "@dex/adapter/SolidlyseriesAdapter.sol";

contract Deploy is Script {
    address deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));

    function run() public {
        require(deployer == 0x399EfA78cAcD7784751CD9FBf2523eDf9EFDf6Ad, "wrong deployer! change the private key");

        // deploy on scroll
        vm.createSelectFork(vm.envString("SCROLL_RPC_URL"));
        vm.startBroadcast(deployer);

        console2.log("block.chainID", block.chainid);
        require(block.chainid == 534352 , "must be scrollchain");
      
        address adapter = address(new SolidlyseriesAdapter());
        console2.log("SkydromeAdapter deployed on scroll: %s", adapter);

        vm.stopBroadcast();
    }
}