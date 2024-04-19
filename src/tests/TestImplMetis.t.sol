pragma solidity 0.8.20;

import "forge-std/Test.sol";

contract ImplTest is Test {
    function setUp() public {}

    function test_upgrade_metis_20240418() public {
        address dexRouter = 0x6b2C0c7be2048Daa9b5527982C29f48062B34D58;
        address newImpl = 0x6BDc7e17be5CdBd2777B6f5C3ECF145387506395;
        vm.createSelectFork("https://andromeda.metis.io/?owner=1088", 16661011 - 1);
        vm.store(
            dexRouter,
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc,
            bytes32(uint256(uint160(newImpl)))
        );
        address user = 0x74b611B0850A3e075E0aF5F616138eb06a5A97B7;
        bytes
            memory data = hex"b80c2f090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000096a84536ab84e68ee210561ffd3a038e79736f1000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000003f0bcdc5341f600000000000000000000000000000000000000000000000000013bb4db39934d08000000000000000000000000000000000000000000000000000000006620d27f0000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000003c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000003f0bcdc5341f600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000096a84536ab84e68ee210561ffd3a038e79736f10000000000000000000000000000000000000000000000000000000000000001000000000000000000000000225d627851cbcd16d1e563308804f58dcff5b2180000000000000000000000000000000000000000000000000000000000000001000000000000000000000000225d627851cbcd16d1e563308804f58dcff5b218000000000000000000000000000000000000000000000000000000000000000100000000000000000000271092372dc7425c4b6a05ff5aae791333de750ae9ed000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000000";
        vm.startPrank(user);
        (bool s, ) = dexRouter.call(data);
        require(s);
    }
}