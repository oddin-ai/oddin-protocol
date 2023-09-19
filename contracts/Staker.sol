// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import {OddinToken} from './oddinToken.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Staker {
    struct Delegator {
        uint256 balance;
        uint256 timestamp;
    }

    constructor(uint256 _rewardRatePerSecond, address _token) {
        owner = msg.sender;
        paused = false;
        rewardRatePerSecond = _rewardRatePerSecond;
        oddinToken = OddinToken(_token);
    }

    mapping(address => mapping(address => Delegator)) public delegators;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public delegatorsTotals;

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

    function updateRewardRate(uint256 newRewardRate) public ownerOnly {
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
        return balances[delegator];
    }

    function getTotalStaked() public view returns (uint256) {
        return totalStaked;
    }

    function getDelegatorTotal(
        address delegator
    ) public view returns (uint256) {
        return delegatorsTotals[delegator];
    }

    function balanceForChannel(
        address delegator,
        address channel
    ) public view returns (uint256) {
        return delegators[delegator][channel].balance;
    }

    function stakeFor(
        address delegator,
        uint256 amount
    ) public payable notPaused {
        require(amount > 0, 'You need to stake more than 0');
        oddinToken.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] = balances[msg.sender] + amount;
        delegators[msg.sender][delegator] = Delegator(amount, block.timestamp);
        delegatorsTotals[delegator] = delegatorsTotals[delegator] + amount;
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
        delegatorsTotals[delegatorTarget] =
            delegatorsTotals[delegatorTarget] -
            individualBalance;
        balances[msg.sender] = balances[msg.sender] - individualBalance;
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
        delegatorsTotals[delegetorTarget] =
            delegatorsTotals[delegetorTarget] -
            fromStaked;
        balances[msg.sender] = balances[msg.sender] - fromStaked;
        totalStaked = totalStaked - fromStaked;
        oddinToken.transfer(msg.sender, fromStaked + accumulatedRewards);
    }

    function claimRewards(address delegatorTarget) public notPaused {
        //notCompleted
        require(
            delegators[msg.sender][delegatorTarget].balance > 0,
            'You have no balance to withdraw!'
        );
        uint256 indBalanceRewards = ((block.timestamp -
            delegators[msg.sender][delegatorTarget].timestamp) *
            rewardRatePerSecond);
        delegators[msg.sender][delegatorTarget].timestamp = block.timestamp;
        oddinToken.transfer(msg.sender, indBalanceRewards);
    }
}
