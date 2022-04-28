const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
require("dotenv").config();

const port = process.env.PORT ? process.env.PORT : 8080;

const { stakingTokenAddress, rewardsTokenAddress, stakingRewardsAddress } = require("../config.js");
const StakingRewardsJson = require("../artifacts/contracts/Staking.sol/StakingRewards.json");
const stakingTokenJson = require("../artifacts/contracts/stakingToken.sol/StakingToken.json");
const rewardsTokenJson = require("../artifacts/contracts/rewardsToken.sol/RewardsToken.json");

let returnObject;

let rpcEndpoint = null,
  pk = process.env.privateKey;

const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

const wallet = new ethers.Wallet(pk, provider);

const signer = wallet.connect(provider);

let signerAddress, balance;

let rewardsToken = new ethers.Contract(rewardsTokenAddress, rewardsTokenJson.abi, signer);
let stakingToken = new ethers.Contract(stakingTokenAddress, stakingTokenJson.abi, signer);
let stakingRewardsContract = new ethers.Contract(stakingRewardsAddress, StakingRewardsJson.abi, signer);

async function init() {
  try {
    signerAddress = wallet.address;

    console.log("signerAddress", signerAddress);

    balance = (await stakingToken.balanceOf(signerAddress)).toString();
    console.log("balance stakingToken", balance);

    balance = (await rewardsToken.balanceOf(signerAddress)).toString();
    console.log("balance rewardsToken", balance);
  } catch (error) {
    console.log("error", error);
  }
}

(async () => {
  await init();
})();

app.use(bodyParser.urlencoded({ extended: true }));

const stake = async (amount) => {
  try {
    if (!amount) return;
    let transaction1 = await stakingToken.approve(stakingRewardsAddress, amount);
    await transaction1.wait();
    let transaction2 = await stakingRewardsContract.stake(amount);
    let tx2 = await transaction2.wait();
    return { transactionHash: tx2.transactionHash };
  } catch (e) {
    console.log(e);
    return e;
  }
};

const unstake = async (amount) => {
  try {
    if (!amount) return;
    let transaction1 = await stakingRewardsContract.unstake(amount);
    let tx1 = await transaction1.wait();
    return { transactionHash: tx1.transactionHash };
  } catch (e) {
    console.log(e);
    return e;
  }
};

app.post("/stake", async (req, res, next) => {
  const { amount } = req.body;

  try {
    const { transactionHash, error } = await stake(amount);
    if (transactionHash) {
      res.send({
        Status: 0,
        StatusText: "OK",
        Message: `${amount} staked`,
        Data: {
          transactionHash: transactionHash,
        },
      });
    }

    if (error) throw error;
  } catch (error) {
    let errMsg = error.toString();
    returnObject = { StatusText: "ERROR", Message: errMsg };
    res.send(returnObject);
    return next(error);
  }
});

app.post("/unstake", async (req, res, next) => {
  const { amount } = req.body;

  try {
    const { transactionHash, error } = await unstake(amount);
    if (transactionHash) {
      res.send({
        StatusText: "OK",
        Message: `${amount} unstaked`,
        Data: {
          transactionHash: transactionHash,
        },
      });
    }

    if (error) throw error;
  } catch (error) {
    let errMsg = error.toString();
    returnObject = { StatusText: "ERROR", Message: errMsg };
    res.send(returnObject);
    return next(error);
  }
});

app.get("/getStakingEvents", async (req, res, next) => {
  try {
    let filter = stakingRewardsContract.filters.Staked();
    let eventsWith = await stakingRewardsContract.queryFilter(filter);
    let filtered = eventsWith.map((event) => [
      {
        staker: event.args["sender"],
        amount: event.args["amount"].toString(),
        balance: event.args["balance"].toString(),
        timestamp: event.args["timestamp"].toString(),
      },
    ]);
    res.send({
      StatusText: "OK",
      Message: `Staking Events`,
      Data: {
        "staking events": filtered,
      },
    });
  } catch (error) {
    returnObject = { StatusText: "ERROR", Message: error.toString() };
    res.send(returnObject);
    return next(error);
  }
});

app.get("/getUnstakingEvents", async (req, res, next) => {
  try {
    let filter = stakingRewardsContract.filters.Unstaked();
    let eventsWith = await stakingRewardsContract.queryFilter(filter);
    let filtered = eventsWith.map((event) => [
      {
        unstaker: event.args["sender"],
        amount: event.args["amount"].toString(),
        balance: event.args["balance"].toString(),
        timestamp: event.args["timestamp"].toString(),
      },
    ]);
    res.send({
      StatusText: "OK",
      Message: `Unstaking Events`,
      Data: {
        "Unstaking events": filtered,
      },
    });
  } catch (error) {
    returnObject = { StatusText: "ERROR", Message: error.toString() };
    res.send(returnObject);
    return next(error);
  }
});

app.get("/getWalletStats", async (req, res, next) => {
  try {
    const users = await stakingRewardsContract.fetchUserArray();
    let data = [];
    for (let i = 0; i < users.length; i++) {
      const balance = await stakingRewardsContract.fetchBalanceOfUser(users[i]);

      let filterUnstaked = stakingRewardsContract.filters.Unstaked(users[i]);
      let eventsWithUnstaked = await stakingRewardsContract.queryFilter(filterUnstaked);
      let filterStaked = stakingRewardsContract.filters.Staked(users[i]);
      let eventsWithStaked = await stakingRewardsContract.queryFilter(filterStaked);

      let filteredStaked = eventsWithStaked.map((event) => [
        event.args["timestamp"].toString(),
        event.args["amount"].toString(),
      ]);
      let filteredUnstaked = eventsWithUnstaked.map((event) => [
        event.args["timestamp"].toString(),
        event.args["amount"].toString(),
      ]);

      data.push({
        wallet: users[i],
        "staked-amount": balance.toString(),
        "staking-timestamp(s)": filteredStaked,
        "unstaking-timestamp(s)": filteredUnstaked,
      });
    }

    res.send({
      StatusText: "OK",
      Message: `Wallet data`,
      Data: {
        "Wallet data": data,
      },
    });
  } catch (error) {
    returnObject = { StatusText: "ERROR", Message: error.toString() };
    res.send(returnObject);
    return next(error);
  }
});

app.post("/setElevatedUserAddress", async (req, res, next) => {
  const { address } = req.body;
  try {
    if (!address) return;
    let transaction1 = await stakingRewardsContract.setElevatedUserAddress(address);
    let tx1 = await transaction1.wait();

    res.send({
      StatusText: "OK",
      Message: `Elevated User Address set, hash`,
      Data: {
        transactionHash: tx1.transactionHash,
      },
    });
  } catch (error) {
    returnObject = { StatusText: "ERROR", Message: error.toString() };
    res.send(returnObject);
    return next(error);
  }
});

app.post("/setCanBeUsedForStaking", async (req, res, next) => {
  const { canBeUsed } = req.body; // 1 means can be used for staking, anything else == no
  try {
    if (canBeUsed == undefined) return;
    let transaction1 = await stakingRewardsContract.setCanBeUsedForStaking(canBeUsed);
    let tx1 = await transaction1.wait();
    res.send({
      StatusText: "OK",
      Message: `Can Be Used For Staking: ${canBeUsed}`,
      Data: {
        transactionHash: tx1.transactionHash,
      },
    });
  } catch (error) {
    returnObject = { StatusText: "ERROR", Message: error.toString() };
    res.send(returnObject);
    return next(error);
  }
});

app.listen(port, () =>
  console.log(`Listening on port ${port} at ${new Date().toISOString()}
  ********** Use Postman or curl or other tools to call above endpoints, e.g. POST 1000 http://localhost:8080/stake *********** `)
);

module.exports = app;
