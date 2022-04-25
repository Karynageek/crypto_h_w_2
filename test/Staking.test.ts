import { expect } from "chai";
import { ethers } from "hardhat";
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

    await orangeToken.grantRole(await orangeToken.ADMIN_ROLE(), staking.address);
  });

  describe('stakes', () => {
    const amount = 100;

    it('stakes successfully without claim', async () => {

      await ortWethMockPair.approve(staking.address, amount);

      const ownerBalancBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalancBefore = await ortWethMockPair.balanceOf(staking.address);

      const result = await staking.stake(amount);

      const ownerBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const { totalAmount, amountToPay, startDate } = await staking.getUserInfo(owner.address);

      expect(ownerBalanceAfter).to.equal(ownerBalancBefore.sub(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalancBefore.add(amount));

      await expect(result).to.emit(staking, "Stake")
        .withArgs(owner.address, amount, startDate);
    })

    it('stakes successfully with claim', async () => {
      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      await ortWethMockPair.approve(staking.address, 10000);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);

      const result = await staking.stake(amount);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      const { totalAmount, amountToPay, startDate } = await staking.getUserInfo(owner.address);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore.sub(amount).sub(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore.add(amount).add(amount));

      await expect(result).to.emit(staking, "Stake")
        .withArgs(owner.address, amount, startDate);
    })
  })

  describe('claims', () => {
    const amount = 100;

    it('claims successfully', async () => {
      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);

      const { totalAmount, amountToPay, startDate } = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      await staking.claim();

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore);
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore);
    })

  })

  describe('withdraws', () => {
    const amount = 100;

    it('withdraws successfully without claim', async () => {
      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      const ownerBalancBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalancBefore = await ortWethMockPair.balanceOf(staking.address);

      await staking.withdraw(amount);

      const ownerBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      expect(ownerBalanceAfter).to.equal(ownerBalancBefore.add(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalancBefore.sub(amount));
    })


    it('withdraws successfully with claim', async () => {
      await ortWethMockPair.approve(staking.address, 10000);

      await staking.stake(amount);

      await incrementNextBlockTimestamp(259200);

      const { totalAmount, amountToPay, startDate } = await staking.getUserInfo(owner.address);

      const ownerOrangeBalanceBefore = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceBefore = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceBefore = await ortWethMockPair.balanceOf(staking.address);

      await staking.withdraw(amount);

      const ownerOrangeBalanceAfter = await orangeToken.balanceOf(owner.address);
      const ownerOrtWethBalanceAfter = await ortWethMockPair.balanceOf(owner.address);
      const stakingBalanceAfter = await ortWethMockPair.balanceOf(staking.address);

      expect(ownerOrangeBalanceAfter).to.equal(ownerOrangeBalanceBefore.add(amountToPay));
      expect(ownerOrtWethBalanceAfter).to.equal(ownerOrtWethBalanceBefore.add(amount));
      expect(stakingBalanceAfter).to.equal(stakingBalanceBefore.sub(amount));
    })

    it('rejects withdraw when amount exceeds staking', async () => {
      await expect(staking.withdraw(amount)).to.be.revertedWith('Amount exceeds staking');
    })

  })

  describe('gets user info', () => {
    const amount = 100;

    it('gets user info successfully', async () => {
      await ortWethMockPair.approve(staking.address, amount);

      await staking.stake(amount);

      const { totalAmount, amountToPay, startDate } = await staking.getUserInfo(owner.address);

      expect(totalAmount).to.equal(amount);
      expect(amountToPay).to.equal(0);

      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const now = blockBefore.timestamp;

      expect(startDate).to.equal(now);
    })

  })

});
