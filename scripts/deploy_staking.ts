import hre, { ethers } from "hardhat";
import { Staking__factory } from "../typechain-types/factories/Staking__factory";

async function main() {
  const orangeTokenContract = "0x894C8c9B0c0040d3Fb71D207dD91DDdea59F71FC";
  const ortWethMockPair = "0xDfd1D4acB55946A62cf364CfCa73F0913d02e5CC";

  const delay = (ms: any) => new Promise((res) => setTimeout(res, ms));

  const Staking = await ethers.getContractFactory("Staking") as Staking__factory;
  const staking = await Staking.deploy(orangeTokenContract, ortWethMockPair);

  await staking.deployed();

  console.log("Staking deployed to:", staking.address);

  await delay(35000);

  await hre.run("verify:verify", {
    address: staking.address,
    constructorArguments: [orangeTokenContract, ortWethMockPair],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
