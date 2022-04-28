// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import "hardhat/console.sol";

contract StakingRewards {
    address owner;
    address _ElevatedUserAddress;
    IERC20 public rewardsToken;
    IERC20 public stakingToken;

    uint256 public rewardRate = 100;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    address[] public userArray;
    mapping(address => bool) public userExists;

    uint8 private _canBeUsedForStaking = 1;

    event Staked(
        address indexed sender,
        uint256 amount,
        uint256 balance,
        uint256 timestamp
    );

    event Unstaked(
        address indexed sender,
        uint256 amount,
        uint256 balance,
        uint256 timestamp
    );

    constructor(address _stakingToken, address _rewardsToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function setElevatedUserAddress(address ElevatedUserAddress) public onlyOwner {
        _ElevatedUserAddress = ElevatedUserAddress;
    }

    modifier _elevatedUserOnly() {
        require(
            msg.sender == _ElevatedUserAddress,
            "must be called by Elevated User only"
        );
        _;
    }

    function setCanBeUsedForStaking(uint8 canBeUsed) public _elevatedUserOnly {
        _canBeUsedForStaking = canBeUsed;
    }

    modifier _canBeUsed() {
        require(
            _canBeUsedForStaking == 1,
            "Contract can't be used for staking now"
        );
        _;
    }

    function _now() internal view returns (uint256) {
        return block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) /
                _totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        return
            ((_balances[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function stake(uint256 _amount) external _canBeUsed updateReward(msg.sender) {
        require(
            _amount > 10 && _amount < 1000000,
            "minimum of 10 tokens and a maximum of 1 million required"
        );
        _totalSupply += _amount;
        if (!userExists[msg.sender]) {
            userArray.push(msg.sender);
            userExists[msg.sender] = true;
        }
        _balances[msg.sender] += _amount;
        emit Staked(msg.sender, _amount, _balances[msg.sender], _now());
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }

    function unstake(uint256 _amount) external _canBeUsed updateReward(msg.sender) {
        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        emit Unstaked(msg.sender, _amount, _balances[msg.sender], _now());
        stakingToken.transfer(msg.sender, _amount);
    }

    function getReward() external _canBeUsed updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);
    }

    function fetchBalanceOfUser(address user) public view returns (uint256) {
        console.log("User balance is %s tokens", _balances[user]);
        return _balances[user];
    }

    function fetchUserArray() public view returns (address[] memory) {
        return userArray;
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}
