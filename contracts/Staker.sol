// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import {OddinToken} from './oddinToken.sol';

contract Staker {
    struct Delegator {
        uint256 balance;
        uint256 timestamp;
    }

    struct ChannelRewards {
        uint256 rewardRate;
        uint256 endTimestamp;
    }

    constructor(uint256 _rewardRatePerSecond, address _token) {
        owner = msg.sender;
        paused = false;
        rewardRatePerSecond = _rewardRatePerSecond;
        oddinToken = OddinToken(_token);
    }

    mapping(address => mapping(address => Delegator)) public delegators;
    mapping(address => uint256) public delegatorBalances;
    mapping(address => uint256) public channelBalances;
    mapping(address => ChannelRewards) public channelRewards;

    address public owner;
    OddinToken public oddinToken;
    bool public paused = false;
    uint256 public totalStaked = 0;
    uint256 public rewardRatePerSecond;

    event Stake(address indexed user, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, uint256 amount, uint256 timestamp);
    event Received(address, uint);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    modifier ownerOnly() {
        require(msg.sender == owner, 'Ownable: caller is not the owner');
        _;
    }

    modifier notPaused() {
        require(!paused, 'Contract is paused');
        _;
    }

    function updateGlobalRewardRate(uint256 newRewardRate) public ownerOnly {
        rewardRatePerSecond = newRewardRate;
    }

    function pauseContract() public ownerOnly {
        paused = true;
    }

    function unpauseContract() public ownerOnly {
        paused = false;
    }

    function rewardRate() public view returns (uint256) {
        return rewardRatePerSecond;
    }

    function balanceOf(address delegator) public view returns (uint256) {
        return delegatorBalances[delegator];
    }

    function getTotalStaked() public view returns (uint256) {
        return totalStaked;
    }

    function balanceOfChannel(address delegator) public view returns (uint256) {
        return channelBalances[delegator];
    }

    function balanceForChannel(
        address delegator,
        address channel
    ) public view returns (uint256) {
        return delegators[delegator][channel].balance;
    }

    function calculateBpts(uint256 a, uint256 b) public pure returns (uint256) {
        require(a > 0, 'a must be greater than 0');
        require(b > 0, 'b must be greater than 0');

        uint256 res = b % a;
        uint256 div = b / a;
        require(div > 0, 'div must be greater than 0');
        uint256 bps = (a * 100) / b;
        if (res == 0 && div > 0) {
            return bps;
        } else if (res > a / 2) {
            bps = a / (b + res);
        } else {
            bps = a / b + a;
        }
        return bps;
    }

    function calculateRewardsForChannel(
        address channel
    ) public view returns (uint256) {
        require(totalStaked > 0, 'No stakers yet!');
        require(channelBalances[channel] > 0, 'No stakers for this channel!');
        uint256 timeframe = block.timestamp -
            delegators[msg.sender][channel].timestamp +
            1;
        uint256 globalrewards = (timeframe *
            rewardRatePerSecond *
            delegators[msg.sender][channel].balance) / totalStaked;
        if (channelRewards[channel].rewardRate == 0) {
            return globalrewards;
        }
        uint256 channelRewardTimeframe = (channelRewards[channel].endTimestamp >
            block.timestamp)
            ? block.timestamp - delegators[msg.sender][channel].timestamp + 1
            : channelRewards[channel].endTimestamp -
                delegators[msg.sender][channel].timestamp;
        uint256 channelAdditionalRewards = (channelRewards[channel].rewardRate >
            0)
            ? (channelRewardTimeframe *
                channelRewards[channel].rewardRate *
                delegators[msg.sender][channel].balance) /
                channelBalances[channel]
            : 0;
        return globalrewards + channelAdditionalRewards;
    }

    function setRewardRateForChannel(
        address channel,
        uint256 amount
    ) public ownerOnly notPaused {
        channelRewards[channel].rewardRate = amount;
    }

    function setRewardDuration(
        address channel,
        uint256 duration
    ) public ownerOnly notPaused {
        channelRewards[channel].endTimestamp = block.timestamp + duration;
    }

    function stakeFor(
        address delegator,
        uint256 amount
    ) public payable notPaused {
        require(amount > 0, 'You need to stake more than 0');
        oddinToken.transferFrom(msg.sender, address(this), amount);
        delegatorBalances[msg.sender] = delegatorBalances[msg.sender] + amount;
        delegators[msg.sender][delegator] = Delegator(amount, block.timestamp);
        channelBalances[delegator] = channelBalances[delegator] + amount;
        totalStaked = totalStaked + amount;
        emit Stake(delegator, amount, block.timestamp);
    }

    function withdrawFrom(address delegatorTarget) public notPaused {
        //notCompleted
        require(
            delegators[msg.sender][delegatorTarget].balance > 0,
            'You have no balance to withdraw!'
        );
        uint256 individualBalance = delegators[msg.sender][delegatorTarget]
            .balance;
        uint256 indBalanceRewards = individualBalance +
            ((block.timestamp -
                delegators[msg.sender][delegatorTarget].timestamp) *
                rewardRatePerSecond);
        delegators[msg.sender][delegatorTarget].balance = 0;
        channelBalances[delegatorTarget] =
            channelBalances[delegatorTarget] -
            individualBalance;
        delegatorBalances[msg.sender] =
            delegatorBalances[msg.sender] -
            individualBalance;
        totalStaked = totalStaked - individualBalance;
        oddinToken.transfer(msg.sender, indBalanceRewards);

        //transfer tokens to delegator
        // (bool sent, bytes memory data) = delegatorTarget.call{
        //     value: indBalanceRewards
        // }('');
    }

    function withdrawAmountFrom(
        address delegetorTarget,
        uint256 amount
    ) public notPaused {
        //notCompleted
        require(
            delegators[msg.sender][delegetorTarget].balance > 0,
            'You have no balance to withdraw!'
        );
        uint256 fromStaked;
        uint256 individualBalance = delegators[msg.sender][delegetorTarget]
            .balance;
        uint256 accumulatedRewards = ((block.timestamp -
            delegators[msg.sender][delegetorTarget].timestamp) *
            rewardRatePerSecond);
        if (amount > individualBalance) {
            fromStaked = individualBalance;
        } else {
            fromStaked = amount;
        }
        delegators[msg.sender][delegetorTarget].balance -= fromStaked;
        channelBalances[delegetorTarget] =
            channelBalances[delegetorTarget] -
            fromStaked;
        delegatorBalances[msg.sender] =
            delegatorBalances[msg.sender] -
            fromStaked;
        totalStaked = totalStaked - fromStaked;
        oddinToken.transfer(msg.sender, fromStaked + accumulatedRewards);
    }

    function claimRewards(address channel) public notPaused {
        //notCompleted
        require(
            delegators[msg.sender][channel].balance > 0,
            'You have no balance to withdraw!'
        );
        uint256 accumulatedRewards = calculateRewardsForChannel(channel);
        delegators[msg.sender][channel].timestamp = block.timestamp;
        oddinToken.transfer(msg.sender, accumulatedRewards);
    }
}
