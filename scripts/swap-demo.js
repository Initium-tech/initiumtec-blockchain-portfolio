// A "stranger buys your coin" simulation on the real Sepolia Uniswap pool:
//   1. deployer sends Account B a little ETH for gas + buying
//   2. Account B swaps 0.002 ETH -> CONCHO through the router
//   3. we print the price before and after — watch it move!
//
// Run:  npx hardhat run scripts/swap-demo.js --network sepolia
const { ethers } = require("hardhat");
require("dotenv").config();

const CONCHO = "0x01579f88f9D91bd4570aD56dA4D8b142A13C0DeC";
const ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

async function main() {
  const [deployer] = await ethers.getSigners();
  const accountB = new ethers.Wallet(process.env.TEST_WALLET_PRIVATE_KEY, ethers.provider);
  const router = new ethers.Contract(ROUTER, [
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[])",
    "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[])",
  ], accountB);
  const token = await ethers.getContractAt("ConchoCoin", CONCHO, deployer);
  const path = [WETH, CONCHO];
  const fmt = (v) => Number(ethers.formatUnits(v, 18)).toLocaleString("en-US");

  const quoteBefore = (await router.getAmountsOut(ethers.parseEther("0.001"), path))[1];
  console.log("Price before: 0.001 ETH buys", fmt(quoteBefore), "CONCHO");

  // 1. Give Account B some ETH (gas + purchase budget).
  const balB = await ethers.provider.getBalance(accountB.address);
  if (balB < ethers.parseEther("0.004")) {
    console.log("\n1) Funding Account B with 0.005 ETH for gas + the buy...");
    const tx = await deployer.sendTransaction({ to: accountB.address, value: ethers.parseEther("0.005") });
    await tx.wait();
    console.log("   funded:", tx.hash);
  } else {
    console.log("\n1) Account B already has gas ETH, skipping funding.");
  }

  // 2. The swap. amountOutMin protects the buyer from price movement between
  //    quoting and execution ("slippage") — we accept up to 5% less than quoted.
  console.log("2) Account B swaps 0.002 ETH -> CONCHO...");
  const buyIn = ethers.parseEther("0.002");
  const quoted = (await router.getAmountsOut(buyIn, path))[1];
  const minOut = (quoted * 95n) / 100n;
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  const txS = await router.swapExactETHForTokens(minOut, path, accountB.address, deadline, { value: buyIn });
  await txS.wait();
  console.log("   swapped:", `https://sepolia.etherscan.io/tx/${txS.hash}`);
  console.log("   Account B now holds:", fmt(await token.balanceOf(accountB.address)), "CONCHO");

  // 3. Price after: B's buy removed CONCHO from the pool and added ETH,
  //    so the next buyer gets FEWER CONCHO per ETH. That IS "price went up".
  const quoteAfter = (await router.getAmountsOut(ethers.parseEther("0.001"), path))[1];
  console.log("\nPrice after:  0.001 ETH buys", fmt(quoteAfter), "CONCHO");
  console.log("Fewer tokens per ETH than before = the buy pushed the price UP.");
  console.log("Every trade also paid a 0.3% fee that accrues to you, the LP.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
