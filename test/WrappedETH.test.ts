import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "@ethersproject/units";
import { WrappedETH__factory } from "../typechain-types/factories/WrappedETH__factory";
import { WrappedETH } from "../typechain-types/WrappedETH";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe('WrappedETH contract', () => {
  let token: WrappedETH;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let decimals: number;
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async () => {
    [owner, addr1, ...addrs] = await ethers.getSigners();

    const WrappedETH = (await ethers.getContractFactory('WrappedETH')) as WrappedETH__factory;
    token = await WrappedETH.deploy();

    await token.deployed();

    decimals = await token.decimals();
  });

  describe('deposit', () => {
    const amount = parseUnits("100", decimals);

    it('deposits successfully', async () => {
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const totalSupplyBefore = await token.totalSupply();
      const etherBalanceBefore = await ethers.provider.getBalance(owner.address);

      const result = await token.deposit({ value: amount });

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      const totalSupplyAfter = await token.totalSupply();
      const etherBalanceAfter = await ethers.provider.getBalance(owner.address);

      const minedTx = await result.wait();
      const fee = minedTx.gasUsed.mul(minedTx.effectiveGasPrice);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(amount));
      expect(totalSupplyAfter).to.equal(totalSupplyBefore.add(amount));
      expect(etherBalanceAfter).to.be.equal(etherBalanceBefore.sub(amount).sub(fee));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(zeroAddress, owner.address, amount);
    })
  })

  describe('withdraw', () => {
    const amount = parseUnits("100", decimals);

    it('withdraws successfully', async () => {
      await token.connect(addr1).deposit({ value: amount });

      const addr1BalanceBefore = await token.balanceOf(addr1.address);
      const totalSupplyeBefore = await token.totalSupply();
      const etherBalanceBefore = await ethers.provider.getBalance(addr1.address);

      const result = await token.connect(addr1).withdraw(amount);

      const addr1BalanceAfter = await token.balanceOf(addr1.address);
      const totalSupplyeAfter = await token.totalSupply();
      const etherBalanceAfter = await ethers.provider.getBalance(addr1.address);

      const minedTx = await result.wait();
      const fee = minedTx.gasUsed.mul(minedTx.effectiveGasPrice);

      expect(addr1BalanceAfter).to.equal(addr1BalanceBefore.sub(amount));
      expect(totalSupplyeAfter).to.equal(totalSupplyeBefore.sub(amount));
      expect(etherBalanceAfter).to.be.equal(etherBalanceBefore.add(amount).sub(fee));

      await expect(result).to.emit(token, "Transfer")
        .withArgs(addr1.address, zeroAddress, amount);
    })
  })

});
