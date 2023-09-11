// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract SimpleToken is ERC20 {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(uint256 initialSupply) ERC20('SimpleToken', 'SMPL') {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
