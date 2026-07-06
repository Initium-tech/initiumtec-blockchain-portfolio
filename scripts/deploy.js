const { ethers, network, run } = require("hardhat");

// Whole tokens; scaled to 18 decimals inside the contract.
const INITIAL_SUPPLY = 1_000_000_000n; // 1 billion

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account. Set DEPLOYER_PRIVATE_KEY and the RPC URL in .env"
    );
  }

  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance:  ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );

  const Token = await ethers.getContractFactory("InitiumToken");
  const token = await Token.deploy(INITIAL_SUPPLY, deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`\nInitiumToken deployed to: ${address}`);
  console.log(`Total supply: ${ethers.formatUnits(await token.totalSupply(), 18)} INIT`);

  // Verify on Etherscan so anyone can read the source — transparency is the point.
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for 5 confirmations before Etherscan verification...");
    await token.deploymentTransaction().wait(5);
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [INITIAL_SUPPLY, deployer.address],
      });
      console.log("Verified on Etherscan.");
    } catch (err) {
      console.log(`Verification skipped/failed: ${err.message}`);
      console.log("You can retry later with:");
      console.log(
        `  npx hardhat verify --network ${network.name} ${address} ${INITIAL_SUPPLY} ${deployer.address}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
