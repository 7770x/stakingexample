const { expect } = require("chai");

let stakingRewards, rewardsToken, stakingToken, stakingRewardsAddress, signer, user;
describe("Staking Contract", function () {
  beforeEach(async function () {
    const [deployer, player] = await ethers.getSigners();
    user = player;
    signer = deployer;

    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy();
    await stakingToken.deployed();

    const RewardsToken = await ethers.getContractFactory("RewardsToken");
    rewardsToken = await RewardsToken.deploy();
    await rewardsToken.deployed();

    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(stakingToken.address, rewardsToken.address);
    await stakingRewards.deployed();
    stakingRewardsAddress = stakingRewards.address;
  });

  // Test cases
  it("staking happens successfully", async function () {
    await stakingToken.approve(stakingRewardsAddress, 10000000);

    await stakingRewards.stake(1000);
    const data = await stakingRewards.fetchUserArray();
    console.log(data);
    data.map((e) => e).every((item) => expect(item).to.be.string);
  });
  it("staking and unstaking happens successfully", async function () {
    await stakingToken.approve(stakingRewardsAddress, 10000000);
    await stakingRewards.stake(1000);
    console.log("Staked 1000");
    await stakingRewards.unstake(700);
    console.log("Unstaked 700");

    const balance = await stakingRewards.fetchBalanceOfUser(signer.address);
    console.log("Remaining staked 300");

    expect(balance).to.be.equal(300);
  });
});
