import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "@ethersproject/units";
import { OrangeToken__factory } from "../typechain-types/factories/OrangeToken__factory";
import { OrangeToken } from "../typechain-types/OrangeToken";
import { OrtWethMockPair__factory } from "../typechain-types/factories/OrtWethMockPair__factory";
import { OrtWethMockPair } from "../typechain-types/OrtWethMockPair";
import { Staking__factory } from "../typechain-types/factories/Staking__factory";
import { Staking } from "../typechain-types/Staking";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function incrementNextBlockTimestamp(amount: number): Promise<void> {
  return ethers.provider.send("evm_increaseTime", [amount]);
}

describe('Staking contract', () => {
  let orangeToken: OrangeToken;
  let ortWethMockPair: OrtWethMockPair;
  let staking: Staking;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let decimals: number;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const deltaPercent = 1;
  const annualPercent = 20;

  beforeEach(async () => {
    [owner, addr1, ...addrs] = await ethers.getSigners();

    const OrangeToken = (await ethers.getContractFactory('OrangeToken')) as OrangeToken__factory;
    orangeToken = await OrangeToken.deploy('Orange Token', 'ORT', 18, 1000000000);

    await orangeToken.deployed();

    const OrtWethMockPair = (await ethers.getContractFactory('OrtWethMockPair')) as OrtWethMockPair__factory;
    ortWethMockPair = await OrtWethMockPair.deploy();

    await ortWethMockPair.deployed();

    const Staking = (await ethers.getContractFactory('Staking')) as Staking__factory;
    staking = await Staking.deploy(orangeToken.address, ortWethMockPair.address);

    await staking.deployed();

    decimals = await ortWethMockPair.decimals();

    await orangeToken.grantRole(await orangeToken.ADMIN_ROLE(), staking.address);
  });

  describe('stakes', () => {
    const amount = parseUnits("100", decimals);

    it('stakes successfully without claim', async () => {
      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      await ortWethMockPair.approve(staking.address, amount);

      const result = await staking.stake(amount);

      const [, amountToPayAfter, startDateAfter] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const minedTx = await result.wait();
      const txBlock = await ethers.provider.getBlock(minedTx.blockNumber);
      const txTimestamp = txBlock.timestamp;

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore);
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore.sub(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore.add(amount));
      expect(amountToPayAfter).to.equal(0);
      expect(startDateAfter).to.equal(txTimestamp);

      await expect(result).to.emit(staking, "Stake")
        .withArgs(owner.address, amount)
        .and.to.not.emit(orangeToken, "Transfer")
        .and.to.not.emit(staking, "Claim");
    })

    it('stakes successfully with claim', async () => {
      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);
      await ethers.provider.send("evm_mine", []);

      const [, , startDateBefore] = await staking.getUserInfo(owner.address);

      await ortWethMockPair.approve(staking.address, amount);

      const result = await staking.stake(amount);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const [, , startDateAfter] = await staking.getUserInfo(owner.address);

      const minedTx = await result.wait();
      const txBlock = await ethers.provider.getBlock(minedTx.blockNumber);
      const txTimestamp = txBlock.timestamp;

      const amountToPay = ((ethers.BigNumber.from(txTimestamp).sub(startDateBefore)).mul(amount).mul(annualPercent)).div(3153600000);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore.sub(amount).sub(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore.add(amount).add(amount));
      expect(startDateAfter).to.equal(txTimestamp);

      await expect(result).to.emit(staking, "Stake")
        .withArgs(owner.address, amount)
        .and.to.emit(orangeToken, "Transfer")
        .withArgs(zeroAddress, owner.address, amountToPay)
        .and.to.emit(staking, "Claim")
        .withArgs(owner.address, amountToPay);
    })
  })

  describe('claims', () => {
    const amount = parseUnits("100", decimals);

    it('claims without rewards successfully', async () => {
      const [, amountToPayBefore, startDateBefore] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      const result = await staking.claim();

      const [, amountToPayAfter, startDateAfter] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore);
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore);
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore);
      expect(amountToPayAfter).to.equal(amountToPayBefore);
      expect(startDateAfter).to.equal(startDateBefore);

      await expect(result).to.not.emit(orangeToken, "Transfer")
        .and.to.not.emit(staking, "Claim");
    })

    it('claims with rewards successfully', async () => {
      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);
      await ethers.provider.send("evm_mine", []);

      const [, , startDateBefore] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      const result = await staking.claim();

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const [, , startDateAfter] = await staking.getUserInfo(owner.address);

      const minedTx = await result.wait();
      const txBlock = await ethers.provider.getBlock(minedTx.blockNumber);
      const txTimestamp = txBlock.timestamp;

      const amountToPay = ((ethers.BigNumber.from(txTimestamp).sub(startDateBefore)).mul(amount).mul(annualPercent)).div(3153600000);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore);
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore);
      expect(startDateAfter).to.equal(txTimestamp);

      await expect(result).to.emit(orangeToken, "Transfer")
        .withArgs(zeroAddress, owner.address, amountToPay)
        .and.to.emit(staking, "Claim")
        .withArgs(owner.address, amountToPay);
    })

  })

  describe('withdraws', () => {
    it('withdraws successfully without claim', async () => {
      const amount = parseUnits("0", decimals);

      const [, amountToPayBefore, startDateBefore] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      const result = await staking.withdraw(amount);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const [, amountToPayAfter, startDateAfter] = await staking.getUserInfo(owner.address);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore);
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore);
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore);
      expect(amountToPayAfter).to.equal(amountToPayBefore);
      expect(startDateAfter).to.equal(startDateBefore);

      await expect(result).to.emit(staking, "Withdraw")
        .withArgs(owner.address, amount)
        .and.to.not.emit(orangeToken, "Transfer")
        .and.to.not.emit(staking, "Claim");
    })


    it('withdraws successfully with claim', async () => {
      const amount = parseUnits("100", decimals);

      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);
      ethers.provider.send("evm_mine", []);

      const [, , startDateBefore] = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      const result = await staking.withdraw(amount);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const [, , startDateAfter] = await staking.getUserInfo(owner.address);

      const minedTx = await result.wait();
      const txBlock = await ethers.provider.getBlock(minedTx.blockNumber);
      const txTimestamp = txBlock.timestamp;

      const amountToPay = ((ethers.BigNumber.from(txTimestamp).sub(startDateBefore)).mul(amount).mul(annualPercent)).div(3153600000);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore.add(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore.sub(amount));
      expect(startDateAfter).to.equal(txTimestamp);

      await expect(result).to.emit(staking, "Withdraw")
        .withArgs(owner.address, amount)
        .and.to.emit(orangeToken, "Transfer")
        .withArgs(zeroAddress, owner.address, amountToPay)
        .and.to.emit(staking, "Claim")
        .withArgs(owner.address, amountToPay);
    })

    it('rejects withdraw when amount exceeds staking', async () => {
      const amount = parseUnits("100", decimals);

      await expect(staking.withdraw(amount)).to.be.revertedWith('Amount exceeds staking');
    })

  })

  describe('gets user info', () => {
    const amount = parseUnits("100", decimals);

    it('gets user info successfully', async () => {
      await ortWethMockPair.approve(staking.address, amount);

      const result = await staking.stake(amount);

      const [totalAmount, amountToPay, startDate] = await staking.getUserInfo(owner.address);

      const minedTx = await result.wait();
      const txBlock = await ethers.provider.getBlock(minedTx.blockNumber);
      const txTimestamp = txBlock.timestamp;

      expect(totalAmount).to.equal(amount);
      expect(amountToPay).to.equal(0);
      expect(startDate).to.equal(txTimestamp);
    })

  })

});
