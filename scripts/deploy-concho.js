const { ethers, network, run } = require("hardhat");

// Whole tokens; scaled to 18 decimals inside the contract.
const INITIAL_SUPPLY = 100_000_000_000n; // 100 billion CONCHO

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const Token = await ethers.getContractFactory("ConchoCoin");
  const token = await Token.deploy(INITIAL_SUPPLY, deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`\nConchoCoin deployed to: ${address}`);
  console.log(`Total supply: ${ethers.formatUnits(await token.totalSupply(), 18)} CONCHO`);

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
      console.log(`Verification failed: ${err.message}`);
      console.log(
        `Retry with: npx hardhat verify --network ${network.name} ${address} ${INITIAL_SUPPLY} ${deployer.address}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
