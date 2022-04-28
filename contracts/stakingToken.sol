// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StakingToken is ERC20 {
    constructor() ERC20("StakingToken", "STK") {
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
