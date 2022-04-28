# Staking contract and server example

## yarn

## start hardhat node

`npx hardhat node`

## edit .env file to add private key of one of the hardhat accounts

## compile and deploy contracts

`npx hardhat run --network localhost scripts/deploy.js`

## start server

`node server/server.js`

## example API calls via Postman or curl or any other API tool:

- A function allows the user to stake an ERC20 token (minimum of 10 tokensand a maximum of 1 million).
  `curl --location --request POST 'http://localhost:8080/stake' --data-urlencode 'amount=5000'`

- The contract emits an event for every successful staking.

> event Staked(
> address indexed sender,
> uint256 amount,
> uint256 balance,
> uint256 timestamp
> );

- A function lets you un-stake the token.
  `curl --location --request POST 'http://localhost:8080/unstake' --data-urlencode 'amount=500'`

- The contract emits an event for every successful un-staking.

  > event Unstaked(
  > address indexed sender,
  > uint256 amount,
  > uint256 balance,
  > uint256 timestamp
  > );

- A function that provides you details of all wallets that have staked and un-staked along with the respective timestamps for each action.

`curl --location --request GET 'http://localhost:8080/getWalletStats?address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'`

```"Wallet data": [
            {
                "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "staked-amount": "4500",
                "staking-timestamp(s)": [
                    [
                        "1651137505",
                        "5000"
                    ]
                ],
                "unstaking-timestamp(s)": [
                    [
                        "1651137838",
                        "500"
                    ]
                ]
            }
        ]
```

- A function that lets the admin/owner of the contract configure whether the contract can be used for staking.

  1. this call sets an admin/elevated user:

`curl --location --request POST 'http://localhost:8080/setElevatedUserAddress' --data-urlencode 'address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'`

      2) this call allows to switch on staking ("1") or switch it off ("2"):

`curl --location --request POST 'http://localhost:8080/setCanBeUsedForStaking' --data-urlencode 'canBeUsed=1'`

## Detailed API documentation:

`https://documenter.getpostman.com/view/105427/UyrEhF5f`
