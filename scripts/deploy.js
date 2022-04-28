// const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const StakingToken = await ethers.getContractFactory("StakingToken");
  const stakingToken = await StakingToken.deploy();
  await stakingToken.deployed();
  console.log("stakingToken deployed to:", stakingToken.address);

  const RewardsToken = await ethers.getContractFactory("RewardsToken");
  const rewardsToken = await RewardsToken.deploy();
  await rewardsToken.deployed();
  console.log("rewardsToken deployed to:", rewardsToken.address);

  const StakingRewards = await ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(stakingToken.address, rewardsToken.address);
  await stakingRewards.deployed();
  console.log("stakingRewards deployed to:", stakingRewards.address);

  let config = `
  const deployerAddress = "${deployer.address}"
  const stakingTokenAddress = "${stakingToken.address}"
  const rewardsTokenAddress = "${rewardsToken.address}"
  const stakingRewardsAddress = "${stakingRewards.address}"

  module.exports = { deployerAddress, stakingTokenAddress, rewardsTokenAddress, stakingRewardsAddress };
  `;

  let data = JSON.stringify(config);
  fs.writeFileSync("config.js", JSON.parse(data));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
