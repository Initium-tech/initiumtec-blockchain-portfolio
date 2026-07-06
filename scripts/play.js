// A guided on-chain play session on Sepolia:
//   1. transfer 1,000 INIT  deployer -> test wallet (Account B)
//   2. burn 500 INIT from the deployer, shrinking totalSupply forever
// Run with:  npx hardhat run scripts/play.js --network sepolia
const { ethers } = require("hardhat");
require("dotenv").config();

const TOKEN = "0x2EC1a7c1deC09763757cAca2caC91197f1A54122";

async function main() {
  const [deployer] = await ethers.getSigners();
  const accountB = new ethers.Wallet(process.env.TEST_WALLET_PRIVATE_KEY);
  const token = await ethers.getContractAt("InitiumToken", TOKEN, deployer);
  const fmt = (v) => ethers.formatUnits(v, 18);
  const link = (h) => `https://sepolia.etherscan.io/tx/${h}`;

  console.log("Supply before:", fmt(await token.totalSupply()), "INIT\n");

  // --- 1. Transfer -------------------------------------------------------
  const amount = ethers.parseUnits("1000", 18);
  console.log(`Transferring 1,000 INIT -> Account B (${accountB.address})...`);
  const tx1 = await token.transfer(accountB.address, amount);
  await tx1.wait();
  console.log("  confirmed:", link(tx1.hash));
  console.log("  Account B balance:", fmt(await token.balanceOf(accountB.address)), "INIT\n");

  // --- 2. Burn -----------------------------------------------------------
  const burnAmount = ethers.parseUnits("500", 18);
  console.log("Burning 500 INIT from the deployer...");
  const tx2 = await token.burn(burnAmount);
  await tx2.wait();
  console.log("  confirmed:", link(tx2.hash));

  console.log("\nSupply after:", fmt(await token.totalSupply()), "INIT");
  console.log("(999,999,500 — the 500 burned are gone forever; no one can re-mint them.)");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
