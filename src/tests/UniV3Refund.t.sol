// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "forge-std/test.sol";
import "forge-std/console2.sol";

import "@dex/DexRouter.sol";

contract UniswapV3Test is Test {
    address user = 0x07d3915Efd92a536c406F5063918d2Df0d9708e7;
    address payable okx_dexrouter =
        payable(0x7D0CcAa3Fac1e5A943c5168b6CEd828691b46B36);
    address uni_router = 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;
    address pool = 0x4416056ccF79fFD3abd99e61ccF80eA13EA4311c;
    address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address FILM = 0xe344Fb85b4FAb79e0ef32cE77c00732CE8566244;
    address fee_collector = 0x000000fee13a103A10D593b9AE06b3e05F2E7E1c;
    address inch_router = 0x111111125421cA6dc452d289314280a0f8842A65;

    function setUp() public {
        vm.createSelectFork(
            vm.envString("ETH_RPC_URL"),
            bytes32(
                0x1ed0d036c93beb24347dc20489b313db544d57efd72d26a0a38168c3d99409e0
            )
        );
        vm.etch(address(okx_dexrouter), address(new DexRouter()).code);
    }

    function test_okx() public {
        uint256[] memory pools = new uint256[](1);
        pools[0] = uint256(bytes32(abi.encodePacked(bytes12(0), pool)));
        DexRouter(okx_dexrouter).uniswapV3SwapTo{value: 3 ether}(
            uint256(
                bytes32(abi.encodePacked(bytes9(0), bytes3(0x019b8d), user))
            ),
            3000000000000000000,
            390789165003,
            pools
        );
    }
    // {
    //   "Func": "execute",
    //   "Params": [
    //     "0x0b000604",
    //     [
    //       "0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002386f26fc10000",
    //       "0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710e344fb85b4fab79e0ef32ce77c00732ce8566244000000000000000000000000000000000000000000",
    //       "0x000000000000000000000000e344fb85b4fab79e0ef32ce77c00732ce8566244000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c0000000000000000000000000000000000000000000000000000000000000019",
    //       "0x000000000000000000000000e344fb85b4fab79e0ef32ce77c00732ce856624400000000000000000000000041244656f62711cc44f2e5001a5e7a960e8cb4bb000000000000000000000000000000000000000000000000000000043b2f31db"
    //     ],
    //     "1733732445"
    //   ]
    // }

    function _test_uni() public {
        bytes memory commands = hex"0b000604";
        uint256 deadline = type(uint256).max;
        bytes[] memory inputs = new bytes[](4);
        // 0b => Commands.WRAP_ETH
        inputs[0] = abi.encode(address(0x02), 3 ether);
        // 00 => Commands.V3_SWAP_EXACT_IN
        bytes memory path = abi.encodePacked(WETH, bytes3(uint24(10000)), FILM);
        inputs[1] = abi.encode(address(0x02), 3 ether, uint256(0), path, false);
        // 06 => commands.PAY_PORTION
        inputs[2] = abi.encode(FILM, fee_collector, uint256(0x19));
        // 04 => commands.SWEEP
        inputs[3] = abi.encode(FILM, user, 1);
        console2.logBytes(
            abi.encodeWithSignature(
                "execute(bytes,bytes[],uint256)",
                commands,
                inputs,
                deadline
            )
        );
        uni_router.call{value: 3 ether}(
            abi.encodeWithSignature(
                "execute(bytes,bytes[],uint256)",
                commands,
                inputs,
                deadline
            )
        );
    }
}
