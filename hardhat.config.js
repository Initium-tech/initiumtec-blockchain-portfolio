require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Never hardcode keys. They live in .env, which is git-ignored.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin v5.4 uses opcodes from the Cancun upgrade (live on
      // mainnet since March 2024); Hardhat's default target is older.
      evmVersion: "cancun",
    },
  },
  networks: {
    // Local in-memory chain: `npx hardhat node`
    hardhat: {},
    // Public Ethereum testnet — free, fake ETH. Practice here first.
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    // Real money. Only after the full testnet dry run + checklist in README.
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
