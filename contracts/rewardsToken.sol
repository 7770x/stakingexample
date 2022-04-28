// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardsToken is ERC20 {
    constructor() ERC20("RewardsToken", "RWDT") {
        _mint(msg.sender, 5000000 * 10**decimals());
    }
}
