pragma solidity 0.8.20;

import "forge-std/Test.sol";

contract ImplTest is Test {
    function setUp() public {}

    function test_upgrade_polyzkevm_20240418() public {
        address dexRouter = 0x6b2C0c7be2048Daa9b5527982C29f48062B34D58;
        address newImpl = 0xE8c25c536550221a52472d50bBaBd2B88353DcE8;
        vm.createSelectFork("https://1rpc.io/polygon/zkevm", 11702672);
        vm.store(
            dexRouter,
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc,
            bytes32(uint256(uint160(newImpl)))
        );
        address user = 0x12a9493534f511C7C2b55bc962F9B382f34A7494;
        bytes
            memory data = hex"b80c2f090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000001e4a5963abfd975d8c9021ce480b42188849d41d000000000000000000000000000000000000000000000000000e35fa931a00000000000000000000000000000000000000000000000000000000000000ab00f60000000000000000000000000000000000000000000000000000000066200d3a0000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000e35fa931a0000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001600000000000000000000000004f9a0e7fd2bf6067db6994cf12e4495df938e6e90000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f304c7323d9101cd90c05696c97a4cf984a9f6a50000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f304c7323d9101cd90c05696c97a4cf984a9f6a500000000000000000000000000000000000000000000000000000000000000018000000000000000000027104412c7152c658967a3360f0a1472e701bdbeca9e0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000400000000000000000000000004f9a0e7fd2bf6067db6994cf12e4495df938e6e90000000000000000000000001e4a5963abfd975d8c9021ce480b42188849d41d0000000000000000000000000000000000000000000000000000000000000000";
        vm.startPrank(user);
        (bool s, ) = dexRouter.call(data);
        require(s);
    }
}
