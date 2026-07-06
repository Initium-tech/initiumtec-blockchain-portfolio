// Creates the CONCHO/ETH liquidity pool on Uniswap V2 (Sepolia).
//
// This is THE moment a token gets a price. We deposit two assets:
//     10,000,000,000 CONCHO  +  0.01 ETH
// and the ratio defines the opening price:
//     1 ETH = 1,000,000,000,000 CONCHO   (0.01 ETH buys ~10B... before slippage)
// From then on, anyone can swap either direction, and every swap moves the
// price along the constant-product curve  x * y = k.
//
// Run:  npx hardhat run scripts/create-pool.js --network sepolia
const { ethers } = require("hardhat");

const CONCHO = "0x01579f88f9D91bd4570aD56dA4D8b142A13C0DeC";
const ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3"; // Uniswap V2 Router02, Sepolia
const FACTORY = "0xF62c03E08ada871A0bEb309762E260a7a6a880E6";

const TOKEN_AMOUNT = ethers.parseUnits("10000000000", 18); // 10B CONCHO
const ETH_AMOUNT = ethers.parseEther("0.01");

async function main() {
  const [deployer] = await ethers.getSigners();
  const token = await ethers.getContractAt("ConchoCoin", CONCHO, deployer);
  const router = new ethers.Contract(ROUTER, [
    "function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) payable returns (uint,uint,uint)",
  ], deployer);
  const factory = new ethers.Contract(FACTORY, [
    "function getPair(address,address) view returns (address)",
  ], deployer);
  const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // canonical Sepolia WETH

  // Step 1: approve — the standard two-step DEX dance. We grant the router
  // permission to pull EXACTLY the amount we intend to deposit, no more.
  console.log("1) Approving router for 10B CONCHO...");
  const txA = await token.approve(ROUTER, TOKEN_AMOUNT);
  await txA.wait();
  console.log("   approved:", txA.hash);

  // Step 2: create the pool + deposit both sides in one call.
  console.log("2) Adding liquidity (10B CONCHO + 0.01 ETH)...");
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min
  const txL = await router.addLiquidityETH(
    CONCHO,
    TOKEN_AMOUNT,
    TOKEN_AMOUNT, // min token (no slippage tolerance needed — we ARE the first deposit)
    ETH_AMOUNT,   // min ETH
    deployer.address, // LP tokens go to us (on mainnet you would LOCK these)
    deadline,
    { value: ETH_AMOUNT }
  );
  await txL.wait();
  console.log("   liquidity added:", txL.hash);

  const pair = await factory.getPair(CONCHO, WETH);
  console.log("\nPool (pair contract):", pair);
  console.log(`https://sepolia.etherscan.io/address/${pair}`);
  console.log("\nOpening price: 1 ETH = 1,000,000,000,000 CONCHO");
  console.log("LP tokens are in the deployer wallet. On mainnet, locking/burning");
  console.log("these is the anti-rug-pull step. On testnet, we keep them to learn.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
