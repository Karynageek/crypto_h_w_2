//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OrtWethMockPair is ERC20 {
    constructor() ERC20("Ort Weth Mock Pair", "OWMP") {
        _mint(msg.sender, 10000000000 * 10**18);
    }
}
