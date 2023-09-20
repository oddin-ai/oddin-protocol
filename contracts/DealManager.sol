// SPDX-License-Identifier:MIT
pragma solidity ^0.8.9;

import {OddinDollarToken} from './OddinDollarToken.sol';

contract DealManager {
    enum DealStatus {
        PENDING,
        COMPLETED,
        CANCELLED
    }

    enum ChannelStatus {
        PENDING,
        VALIDATED,
        INVALIDATED
    }
    struct Deal {
        uint id;
        uint256 amount;
        address buyerId;
        address channelId;
        uint256 createdTime;
        uint256 updatedTime;
        uint8 packageId;
        DealStatus status;
    }

    mapping(address => mapping(address => Deal)) public deals;
    mapping(address => uint256) public channelPendingBalances;
    mapping(address => ChannelStatus) public validatedChannels;

    event NewDeal(
        uint id,
        uint256 amount,
        address buyerAddress,
        address channelAddress
    );

    event DealStatusUpdated(
        uint id,
        DealStatus oldStatus,
        DealStatus newStatus
    );

    event ClaimEvent(address channelId, uint256 amount);

    address public owner;
    bool public paused = false;
    uint256 public totalLocked = 0;
    uint256 public totalTransacted = 0;
    uint256 public totalClaimed = 0;
    uint256 public totalReverted = 0;
    uint256 public tresuryPending = 0;
    uint256 public tresuryFee = 20;
    OddinDollarToken public dollarToken;

    constructor(address _dollarToken) {
        dollarToken = OddinDollarToken(_dollarToken);
        owner = msg.sender;
        paused = false;
    }

    modifier ownerOnly() {
        require(msg.sender == owner, 'Ownable: caller is not the owner');
        _;
    }

    modifier notPaused() {
        require(!paused, 'Pausable: paused');
        _;
    }

    function pauseContract() public ownerOnly {
        paused = true;
    }

    function unpauseContract() public ownerOnly {
        paused = false;
    }

    function addChannel(address channelId) public ownerOnly {
        validatedChannels[channelId] = ChannelStatus.INVALIDATED;
    }

    function validateChannel(address channelId) public ownerOnly {
        validatedChannels[channelId] = ChannelStatus.VALIDATED;
    }

    function createDeal(
        uint id,
        uint256 amount,
        address channelAddress,
        uint8 packageId,
        DealStatus status
    ) public payable notPaused {
        require(amount > 0, 'Amount must be greater than 0');

        Deal memory newDeal = Deal(
            id,
            amount,
            msg.sender,
            channelAddress,
            block.timestamp,
            block.timestamp,
            packageId,
            status
        );
        dollarToken.transferFrom(msg.sender, address(this), amount);
        deals[msg.sender][channelAddress] = newDeal;
        channelPendingBalances[channelAddress] += amount;
        totalLocked += amount;
        emit NewDeal(id, amount, msg.sender, channelAddress);
    }

    function getDeal(
        address buyerId,
        address channelId
    )
        public
        view
        returns (
            uint id,
            uint256 amount,
            address buyerAddress,
            address channelAddress,
            uint256 createdTime,
            uint256 updatedTime,
            uint8 packageId,
            DealStatus status
        )
    {
        Deal memory deal = deals[buyerId][channelId];
        return (
            deal.id,
            deal.amount,
            deal.buyerId,
            deal.channelId,
            deal.createdTime,
            deal.updatedTime,
            deal.packageId,
            deal.status
        );
    }

    function updateDealStatus(
        address buyerId,
        address channelId,
        DealStatus status
    ) public ownerOnly {
        Deal storage deal = deals[buyerId][channelId];
        deal.status = status;
        if (status == DealStatus.COMPLETED) {
            totalTransacted += deal.amount;
            tresuryPending += (deal.amount * tresuryFee) / 100;
        }
        emit DealStatusUpdated(deal.id, deal.status, status);
    }

    function claimPayment(address buyerId) public notPaused {
        Deal storage deal = deals[buyerId][msg.sender];
        require(deal.status == DealStatus.COMPLETED, 'Deal is not completed');
        uint256 channelFee = deal.amount - (deal.amount * tresuryFee) / 100;
        dollarToken.transfer(msg.sender, channelFee);
        deal.amount = 0;
        channelPendingBalances[msg.sender] -= deal.amount;
        totalLocked -= deal.amount;
        totalClaimed += channelFee;
        emit ClaimEvent(msg.sender, channelFee);
    }

    function revertDeal(
        address buyerId,
        address channelId
    ) public notPaused ownerOnly {
        Deal storage deal = deals[buyerId][channelId];
        require(deal.status == DealStatus.CANCELLED, 'Deal is not canceled');
        deal.amount = 0;
        dollarToken.transfer(buyerId, deal.amount);
        channelPendingBalances[channelId] -= deal.amount;
        totalReverted += deal.amount;
        tresuryPending -= (deal.amount * tresuryFee) / 100;
    }

    function tresuryClaim() public ownerOnly notPaused {
        dollarToken.transfer(owner, tresuryPending);
        tresuryPending = 0;
    }
}
