// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title InitiumToken
 * @notice A simple, fixed-supply ERC-20 token for learning and community
 *         experimentation.
 *
 * Security-by-design decisions (each one removes a whole class of rug-pull
 * or exploit risk):
 *
 *  1. FIXED SUPPLY. The entire supply is minted once, in the constructor.
 *     There is no mint() function, so nobody — not even the deployer — can
 *     ever inflate the supply after launch.
 *
 *  2. NO OWNER. The contract has no Ownable admin, no pause switch, no
 *     blacklist, no fee knobs. Holders never have to trust the deployer
 *     not to flip a switch against them.
 *
 *  3. NO TRANSFER TAXES OR HOOKS. Transfers are plain OpenZeppelin ERC-20
 *     transfers. "Tokenomics" tricks (reflection fees, max-wallet limits,
 *     anti-bot toggles) are the most common source of both bugs and scams,
 *     so this token has none.
 *
 *  4. Burnable: holders may destroy their OWN tokens (and only their own),
 *     which is a standard, safe extension.
 *
 *  5. Permit (EIP-2612): allows gasless approvals via signatures — a modern
 *     convenience that wallets and DEXes understand.
 */
contract InitiumToken is ERC20, ERC20Burnable, ERC20Permit {
    /**
     * @param initialSupply Whole-token supply, e.g. 1_000_000_000 for 1B.
     *        It is scaled by decimals() (18) inside the constructor.
     * @param recipient     Address that receives the full initial supply.
     */
    constructor(uint256 initialSupply, address recipient)
        ERC20("Initium Token", "INIT")
        ERC20Permit("Initium Token")
    {
        require(recipient != address(0), "recipient is zero address");
        _mint(recipient, initialSupply * 10 ** decimals());
    }
}
