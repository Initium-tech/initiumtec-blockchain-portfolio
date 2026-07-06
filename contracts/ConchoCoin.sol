// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title ConchoCoin — ¡concho! 🇵🇷
 * @notice A meme coin with the same security-by-design as InitiumToken:
 *         fixed supply minted once in the constructor, no mint(), no owner,
 *         no pause/blacklist, no transfer taxes, no upgradeability.
 *         Holders never have to trust the deployer with anything.
 */
contract ConchoCoin is ERC20, ERC20Burnable, ERC20Permit {
    /**
     * @param initialSupply Whole-token supply (e.g. 100_000_000_000 for 100B),
     *        scaled by decimals() (18) inside the constructor.
     * @param recipient     Address that receives the full initial supply.
     */
    constructor(uint256 initialSupply, address recipient)
        ERC20("Concho", "CONCHO")
        ERC20Permit("Concho")
    {
        require(recipient != address(0), "recipient is zero address");
        _mint(recipient, initialSupply * 10 ** decimals());
    }
}
