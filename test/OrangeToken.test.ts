import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "@ethersproject/units";
import { OrangeToken__factory } from "../typechain-types/factories/OrangeToken__factory";
import { OrangeToken } from "../typechain-types/OrangeToken";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe('Orange Token contract', () => {
  let token: OrangeToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  const name = 'Orange Token';
  const symbol = 'ORT';
  const decimals = 18;
  const totalSupply = parseUnits('1000000000');
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const OrangeToken = (await ethers.getContractFactory('OrangeToken')) as OrangeToken__factory;
    token = await OrangeToken.deploy(name, symbol, decimals, 1000000000);

    await token.deployed();
  });

  describe("deployment", () => {
    it('track the name', async () => {
      expect(await token.name()).to.equal(name);
    })

    it('track the symbol', async () => {
      expect(await token.symbol()).to.equal(symbol);
    })

    it('track the decimals', async () => {
      expect(await token.decimals()).to.equal(decimals);
    })

    it('track the total supply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    })

    it('assigns the total supply to the deployer', async () => {
      expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
    })
  });

  describe('transfers tokens', () => {
    const amount = parseUnits("100", decimals);

    it('transfers successfully', async () => {
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const addr1BalanceBefore = await token.balanceOf(addr1.address);

      const result = await token.transfer(addr1.address, amount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      const addr1BalanceAfter = await token.balanceOf(addr1.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(amount));
      expect(addr1BalanceAfter).to.equal(addr1BalanceBefore.add(amount));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    })

    it('rejects transfer by zero address', async () => {
      await expect(token.transfer(zeroAddress, amount)).to.be.revertedWith('Transfer to the zero address');
    })

    it('rejects insufficient balances', async () => {
      await expect(token.transfer(addr1.address, parseUnits('10000000000', decimals))).to.be.revertedWith('Insufficient balance');
    })
  })

  describe('approving tokens', () => {
    const amount = parseUnits("100", decimals);

    it('approves successfully', async () => {
      const result = await token.approve(addr1.address, amount);
      const allowance = await token.allowance(owner.address, addr1.address)

      expect(allowance).to.equal(amount);

      await expect(result).to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    })

    it('rejects approve by zero address', async () => {
      await expect(token.approve(zeroAddress, amount)).to.be.revertedWith('Approve the zero address');
    })

  })

  describe('delegated token transfers', () => {
    const amount = parseUnits("100", decimals);

    it('transfers successfully', async () => {
      await token.approve(addr1.address, amount);

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const addr1BalanceBefore = await token.balanceOf(addr1.address);
      const addr2BalanceBefore = await token.balanceOf(addr2.address);

      const result = await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      const addr1BalanceAfter = await token.balanceOf(addr1.address);
      const addr2BalanceAfter = await token.balanceOf(addr2.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(amount));
      expect(addr1BalanceAfter).to.equal(addr1BalanceBefore);
      expect(addr2BalanceAfter).to.equal(addr2BalanceBefore.add(amount));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(owner.address, addr2.address, amount);
    })

    it('rejects transfer by zero address', async () => {
      await expect(token.transferFrom(owner.address, zeroAddress, amount)).to.be.revertedWith('Transfer to the zero address');
    })

    it('rejects insufficient balances', async () => {
      await expect(token.transferFrom(owner.address, addr1.address, parseUnits('10000000000', decimals))).to.be.revertedWith('Insufficient balance');
    })

    it('rejects not allowed amount', async () => {
      await expect(token.transferFrom(owner.address, addr1.address, amount)).to.be.revertedWith('Not allowed amount');
    })
  })

  describe('mint', () => {
    const amount = parseUnits("100", decimals);

    it('mints successfully', async () => {
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const totalSupplyeBefore = await token.totalSupply();

      const result = await token.mint(owner.address, amount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      const totalSupplyeAfter = await token.totalSupply();

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(amount));
      expect(totalSupplyeAfter).to.equal(totalSupplyeBefore.add(amount));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(zeroAddress, owner.address, amount);
    })

    it('rejects mint by zero address', async () => {
      await expect(token.mint(zeroAddress, amount)).to.be.revertedWith('Mint to the zero address');
    })
  })

  describe('burn', () => {
    const amount = parseUnits("100", decimals);

    it('burns successfully', async () => {
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const totalSupplyeBefore = await token.totalSupply();

      const result = await token.burn(owner.address, amount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      const totalSupplyeAfter = await token.totalSupply();

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(amount));
      expect(totalSupplyeAfter).to.equal(totalSupplyeBefore.sub(amount));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(owner.address, zeroAddress, amount);
    })

    it('rejects burn by zero address', async () => {
      await expect(token.burn(zeroAddress, amount)).to.be.revertedWith('Burn to the zero address');
    })

    it('rejects burn when amount exceeds balance', async () => {
      await expect(token.burn(addr2.address, amount)).to.be.revertedWith('Amount exceeds balance');
    })
  })

});
