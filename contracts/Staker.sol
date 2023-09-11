// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

contract Staker {
    struct Delegator {
        address delegatorAddress;
        address delegateAddress;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Delegator) public delegators;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;

    uint256 public totalStaked = 0;
    uint256 public constant rewardRatePerSecond = 0.00001 ether;
    uint256 public constant minimumStakeTime = 1 days;
    uint256 public withdrawalDeadline = block.timestamp + 120 seconds;
    uint256 public claimDeadline = block.timestamp + 240 seconds;

    event Stake(address indexed user, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, uint256 amount, uint256 timestamp);
    event Received(address, uint);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function withdrawalTimeLeft() public view returns (uint256 wTimeLeft) {
        if (block.timestamp >= withdrawalDeadline) {
            return (0);
        } else {
            return (withdrawalDeadline - block.timestamp);
        }
    }

    function claimPeriodLeft() public view returns (uint256 cPeriodLeft) {
        if (block.timestamp >= claimDeadline) {
            return (0);
        } else {
            return (claimDeadline - block.timestamp);
        }
    }

    modifier withdrawalDeadlineReached(bool requireReached) {
        uint256 timeRemaining = withdrawalTimeLeft();
        if (requireReached) {
            require(timeRemaining == 0, 'Withdrawal period is not reached yet');
        } else {
            require(timeRemaining > 0, 'Withdrawal period has been reached');
        }
        _;
    }

    modifier claimDeadlineReached(bool requireReached) {
        uint256 timeRemaining = claimPeriodLeft();
        if (requireReached) {
            require(timeRemaining == 0, 'Claim deadline is not reached yet');
        } else {
            require(timeRemaining > 0, 'Claim deadline has been reached');
        }
        _;
    }

    // modifier notCompleted() {
    //     bool completed = exampleExternalContract.completed();
    //     require(!completed, "Stake already completed!");
    //     _;
    // }

    function stake()
        public
        payable
        withdrawalDeadlineReached(false)
        claimDeadlineReached(false)
    {
        balances[msg.sender] = balances[msg.sender] + msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        emit Stake(msg.sender, msg.value, block.timestamp);
    }

    function withdraw()
        public
        withdrawalDeadlineReached(true)
        claimDeadlineReached(false)
    {
        //notCompleted
        require(balances[msg.sender] > 0, 'You have no balance to withdraw!');
        uint256 individualBalance = balances[msg.sender];
        uint256 indBalanceRewards = individualBalance +
            ((block.timestamp - depositTimestamps[msg.sender]) *
                rewardRatePerSecond);
        balances[msg.sender] = 0;

        // Transfer all ETH via call! (not transfer) cc: https://solidity-by-example.org/sending-ether
        (bool sent, bytes memory data) = msg.sender.call{
            value: indBalanceRewards
        }('');
        require(sent, 'RIP; withdrawal failed :( ');
    }
}
