const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const INITIAL_SUPPLY = 1_000_000_000n; // 1 billion whole tokens

describe("InitiumToken", function () {
  async function deployFixture() {
    const [deployer, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("InitiumToken");
    const token = await Token.deploy(INITIAL_SUPPLY, deployer.address);
    return { token, deployer, alice, bob };
  }

  describe("Deployment", function () {
    it("sets name, symbol and 18 decimals", async function () {
      const { token } = await loadFixture(deployFixture);
      expect(await token.name()).to.equal("Initium Token");
      expect(await token.symbol()).to.equal("INIT");
      expect(await token.decimals()).to.equal(18);
    });

    it("mints the full supply to the recipient", async function () {
      const { token, deployer } = await loadFixture(deployFixture);
      const expected = INITIAL_SUPPLY * 10n ** 18n;
      expect(await token.totalSupply()).to.equal(expected);
      expect(await token.balanceOf(deployer.address)).to.equal(expected);
    });

    it("rejects a zero-address recipient", async function () {
      const Token = await ethers.getContractFactory("InitiumToken");
      await expect(Token.deploy(INITIAL_SUPPLY, ethers.ZeroAddress))
        .to.be.revertedWith("recipient is zero address");
    });

    it("has no mint function — supply can never grow", async function () {
      const { token } = await loadFixture(deployFixture);
      expect(token.mint).to.equal(undefined);
      expect(token.owner).to.equal(undefined); // no admin either
    });
  });

  describe("Transfers", function () {
    it("moves tokens between accounts", async function () {
      const { token, deployer, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 18);
      await expect(token.transfer(alice.address, amount))
        .to.changeTokenBalances(token, [deployer, alice], [-amount, amount]);
    });

    it("emits Transfer events", async function () {
      const { token, deployer, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("5", 18);
      await expect(token.transfer(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(deployer.address, alice.address, amount);
    });

    it("reverts when the sender balance is insufficient", async function () {
      const { token, alice, bob } = await loadFixture(deployFixture);
      await expect(
        token.connect(alice).transfer(bob.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Allowances", function () {
    it("supports approve + transferFrom", async function () {
      const { token, deployer, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100", 18);
      await token.approve(alice.address, amount);
      await expect(
        token.connect(alice).transferFrom(deployer.address, bob.address, amount)
      ).to.changeTokenBalances(token, [deployer, bob], [-amount, amount]);
    });

    it("blocks spending beyond the allowance", async function () {
      const { token, deployer, alice, bob } = await loadFixture(deployFixture);
      await token.approve(alice.address, 10n);
      await expect(
        token.connect(alice).transferFrom(deployer.address, bob.address, 11n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("Burning", function () {
    it("lets holders burn their own tokens, reducing total supply", async function () {
      const { token, deployer } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1", 18);
      const before = await token.totalSupply();
      await token.burn(amount);
      expect(await token.totalSupply()).to.equal(before - amount);
    });

    it("cannot burn someone else's tokens without allowance", async function () {
      const { token, deployer, alice } = await loadFixture(deployFixture);
      await expect(
        token.connect(alice).burnFrom(deployer.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});
