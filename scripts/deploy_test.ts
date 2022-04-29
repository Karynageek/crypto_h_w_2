import hre, { ethers } from "hardhat";

async function main() {
  const [addr] = await ethers.getSigners();

  await addr.sendTransaction({
    to: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    data: "0xe8e337000000000000000000000000007b37e762988304c548204392edf20c86304590e0000000000000000000000000b6bcee07f1dc0359c97e882fa31d5b7642cbf8a300000000000000000000000000000000000000000000065a4da25d3016c000000000000000000000000000000000000000000000000000008d8dadf544fc000000000000000000000000000000000000000000000000065a4da25d3016c000000000000000000000000000000000000000000000000000008d8dadf544fc0000000000000000000000000000f2a74b4d7e908fc8a86c2dfee3712ebc8e0a729300000000000000000000000000000000000000000000000000000000626ae6cb",
    gasLimit: 10000000,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
