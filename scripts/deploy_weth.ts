import hre, { ethers } from "hardhat";
import { WrappedETH__factory } from "../typechain-types/factories/WrappedETH__factory";

async function main() {
  const delay = (ms: any) => new Promise((res) => setTimeout(res, ms));

  const WrappedETH = await ethers.getContractFactory("WrappedETH") as WrappedETH__factory;
  const wrappedETH = await WrappedETH.deploy();

  await wrappedETH.deployed();

  console.log("WrappedETH deployed to:", wrappedETH.address);

  await delay(35000);

  await hre.run("verify:verify", {
    address: wrappedETH.address,
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
