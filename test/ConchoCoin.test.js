const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const INITIAL_SUPPLY = 100_000_000_000n; // 100 billion whole tokens

describe("ConchoCoin", function () {
  async function deployFixture() {
    const [deployer, alice] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ConchoCoin");
    const token = await Token.deploy(INITIAL_SUPPLY, deployer.address);
    return { token, deployer, alice };
  }

  it("sets name, symbol and 18 decimals", async function () {
    const { token } = await loadFixture(deployFixture);
    expect(await token.name()).to.equal("Concho");
    expect(await token.symbol()).to.equal("CONCHO");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints the full 100B supply to the recipient", async function () {
    const { token, deployer } = await loadFixture(deployFixture);
    const expected = INITIAL_SUPPLY * 10n ** 18n;
    expect(await token.totalSupply()).to.equal(expected);
    expect(await token.balanceOf(deployer.address)).to.equal(expected);
  });

  it("rejects a zero-address recipient", async function () {
    const Token = await ethers.getContractFactory("ConchoCoin");
    await expect(Token.deploy(INITIAL_SUPPLY, ethers.ZeroAddress))
      .to.be.revertedWith("recipient is zero address");
  });

  it("has no mint function and no owner — supply can never grow", async function () {
    const { token } = await loadFixture(deployFixture);
    expect(token.mint).to.equal(undefined);
    expect(token.owner).to.equal(undefined);
  });

  it("transfers and burns work", async function () {
    const { token, deployer, alice } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("1000000", 18); // 1M CONCHO
    await expect(token.transfer(alice.address, amount))
      .to.changeTokenBalances(token, [deployer, alice], [-amount, amount]);
    const before = await token.totalSupply();
    await token.connect(alice).burn(amount);
    expect(await token.totalSupply()).to.equal(before - amount);
  });
});
