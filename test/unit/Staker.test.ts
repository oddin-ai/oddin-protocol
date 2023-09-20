//write tests for Staker contract
import { expect, assert } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, REWARD_RATE , INITIAL_SUPPLY} from "../../helper-hardhat-config";
import { OddinToken, Staker } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Staker Unit Test", function () {
        //Multipler is used to make reading the math easier because of the 18 decimal points
        const multiplier = 10 ** 18
        let staker: Staker;
        let token : OddinToken;
        let deployer: any;
        let user1: any;
        let user2: any;
        this.beforeAll(async function () {
            [deployer, user1, user2] = await ethers.getSigners();
            token = await ethers.deployContract("OddinToken", [INITIAL_SUPPLY], deployer)
            staker = await ethers.deployContract("Staker", [BigInt(ethers.parseEther(REWARD_RATE)),token.target], deployer)
            
        })
        it("was deployed", async () => {
            console.log("staker address:", staker.target);
            assert(staker.target)
        })
        describe("constructor", () => {
            it("Should have correct REWARD_RATE of token ", async () => {
                const rewardRate = await staker.rewardRate()
                console.log("rewardRate:", rewardRate);
                console.log("REWARD_RATE:", ethers.parseEther(REWARD_RATE));
                assert.equal(rewardRate.toString(), ethers.parseEther(REWARD_RATE).toString())
            })
            it("initializes the token with the correct owner ", async () => {
                const owner = (await staker.owner()).toString()
                console.log("owner:", owner);
                console.log("deployer:", deployer);
                assert.equal(owner, deployer.address)
            })
        })
        describe("pause contracts", () => {
            it("Should be able to pause the contract", async () => {
                await staker.connect(deployer).pauseContract()
                const paused = await staker.paused()
                assert.equal(paused, true)
            })
            it("Only owner can pause the contract", async () => {
                await expect(staker.connect(user1).pauseContract()).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it("Only owner can unpause the contract", async () => {
                await expect(staker.connect(user1).unpauseContract()).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it("Should be able to unpause the contract", async () => {
                await staker.connect(deployer).pauseContract()
                await staker.connect(deployer).unpauseContract()
                const paused = await staker.paused()
                assert.equal(paused, false)
            })
            it("Should not be able to stake when paused", async () => {
                await staker.connect(deployer).pauseContract()
                const stakeAmount = ethers.parseEther("1000")
                await token.approve(staker.target,stakeAmount)
                await expect(staker.connect(deployer).stakeFor(user1.address,stakeAmount)).to.be.revertedWith("Contract is paused")
            })
            it("Should not be able to withdraw amount when paused", async () => {
                await staker.connect(deployer).pauseContract()
                const withdrawAmount = ethers.parseEther("100")
                await expect(staker.connect(deployer).withdrawAmountFrom(user1.address,withdrawAmount)).to.be.revertedWith("Contract is paused")
            })
            it("Should not be able to withdraw when paused", async () => {
                await staker.connect(deployer).pauseContract()
                const withdrawAmount = ethers.parseEther("100")
                await expect(staker.connect(deployer).withdrawFrom(user1.address)).to.be.revertedWith("Contract is paused")
            })
            this.afterEach(async () => {
                await staker.connect(deployer).unpauseContract()
            })
        })
        describe("stake & withdraw", () => {
            this.beforeAll(async () => {
                console.log("is paused??:", await staker.paused());
                await token.approve(deployer.address,ethers.parseEther("100"))
                await token.transferFrom(deployer.address,staker.target,ethers.parseEther("100"))
                const deployerBalance = await token.balanceOf(deployer.address)
                console.log("BeforeAll deployerBalance:", deployerBalance);
                const bal = await token.balanceOf(staker.target);
                console.log("before all staker balance:", bal);
            })
            it("Should be able to stake tokens successfully to an address", async () => {
                console.log("Stake test started....");
                console.log("is paused??:", await staker.paused());
                const stakeAmount = ethers.parseEther("1000")
                const balanceOfContractBefore = await token.balanceOf(staker.target)
                await token.approve(staker.target,stakeAmount)
                await staker.connect(deployer).stakeFor(user1.address,stakeAmount)
                const balanceOfContract = await token.balanceOf(staker.target)
                console.log("balanceOfContract:", balanceOfContract);
                const deployerBalance = await staker.balanceOf(deployer.address)
                console.log("deployerBalance:", deployerBalance);
                const delegatorTotal = await staker.balanceOfChannel(user1.address);
                console.log("delegatorTotal:", delegatorTotal);
                const totalStaked = await staker.totalStaked()
                console.log("totalStaked:", totalStaked);
                const delegatorBalance = await staker.balanceForChannel(deployer.address,user1.address)
                console.log("delegatorBalance:", delegatorBalance);
                assert.equal(deployerBalance, stakeAmount)
                assert.equal(balanceOfContract, balanceOfContractBefore + stakeAmount)
                assert.equal(delegatorTotal, stakeAmount)
                assert.equal(totalStaked, stakeAmount)
                assert.equal(delegatorBalance, stakeAmount)
            })
            it("Should be able to claim rewards with additional channel rewards successfully to an address", async () => {
                const duration = 60 * 60 * 24 * 30
                const reward = ethers.parseEther("0.0000123")
                const stakeAmount = ethers.parseEther("1000")
                await staker.connect(deployer).setRewardRateForChannel(user1.address,reward)
                await staker.connect(deployer).setRewardDuration(user1.address,duration)
                await token.approve(staker.target,stakeAmount)
                const deployerTokenBalanceBefore = await token.balanceOf(deployer.address)
                const balanceOfContractBefore = await token.balanceOf(staker.target)
                console.log("deployerTokenBalanceBefore:", ethers.formatEther(deployerTokenBalanceBefore));
                const channelBalance = await staker.balanceOfChannel(user1.address);
                console.log("channelBalance:", ethers.formatEther(channelBalance));
                const totalStakedInContract = await staker.totalStaked();
                console.log("totalStakedInContract:", ethers.formatEther(totalStakedInContract));
                await new Promise(r => setTimeout(r, 2000));
                await staker.connect(deployer).claimRewards(user1.address);
                const balanceOfContract = await token.balanceOf(staker.target)
                const deployerBalance = await staker.balanceOf(deployer.address)
                const deployerTokenBalanceAfter = await token.balanceOf(deployer.address)
                console.log("deployerTokenBalanceAfter:", ethers.formatEther(deployerTokenBalanceAfter));
                console.log("deployerBalance:", deployerBalance);
                const delegatorTotal = await staker.balanceOfChannel(user1.address);
                console.log("delegatorTotal:", delegatorTotal);
                const totalStaked = await staker.totalStaked()
                console.log("totalStaked:", totalStaked);
                const delegatorBalance = await staker.balanceForChannel(deployer.address,user1.address)
                console.log("delegatorBalance:", delegatorBalance);
                assert.equal(deployerBalance, stakeAmount)
                assert.isBelow(Number(balanceOfContract), Number(balanceOfContractBefore + stakeAmount))
                assert.equal(delegatorTotal, stakeAmount)
                assert.equal(totalStaked, stakeAmount)
                assert.equal(delegatorBalance, stakeAmount)
                assert.isAbove(Number(deployerTokenBalanceAfter.toString()), Number(deployerTokenBalanceBefore.toString()))
            })
            it("Should be able to claim rewards successfully to an address", async () => {
                const stakeAmount = ethers.parseEther("1000")
                const deployerTokenBalanceBefore = await token.balanceOf(deployer.address)
                const balanceOfContractBefore = await token.balanceOf(staker.target)
                console.log("deployerTokenBalanceBefore:", ethers.formatEther(deployerTokenBalanceBefore));
                const channelBalance = await staker.balanceOfChannel(user1.address);
                console.log("channelBalance:", ethers.formatEther(channelBalance));
                const totalStakedInContract = await staker.totalStaked();
                console.log("totalStakedInContract:", ethers.formatEther(totalStakedInContract));
                await new Promise(r => setTimeout(r, 2000));
                await staker.connect(deployer).claimRewards(user1.address);
                const balanceOfContract = await token.balanceOf(staker.target)
                const deployerBalance = await staker.balanceOf(deployer.address)
                const deployerTokenBalanceAfter = await token.balanceOf(deployer.address)
                console.log("deployerTokenBalanceAfter:", ethers.formatEther(deployerTokenBalanceAfter));
                console.log("deployerBalance:", deployerBalance);
                const delegatorTotal = await staker.balanceOfChannel(user1.address);
                console.log("delegatorTotal:", delegatorTotal);
                const totalStaked = await staker.totalStaked()
                console.log("totalStaked:", totalStaked);
                const delegatorBalance = await staker.balanceForChannel(deployer.address,user1.address)
                console.log("delegatorBalance:", delegatorBalance);
                assert.equal(deployerBalance, stakeAmount)
                assert.isBelow(Number(balanceOfContract), Number(balanceOfContractBefore + stakeAmount))
                assert.equal(delegatorTotal, stakeAmount)
                assert.equal(totalStaked, stakeAmount)
                assert.equal(delegatorBalance, stakeAmount)
                assert.isAbove(Number(deployerTokenBalanceAfter.toString()), Number(deployerTokenBalanceBefore.toString()))
            })
            it("Should be able to withdraw amount of tokens successfully to an address", async () => {
                const withdrawAmount = ethers.parseEther("100")
                const stakedAmount = ethers.parseEther("900")
                //await token.approve(staker.target,stakeAmount)
                //await staker.connect(deployer).stakeFor(user1.address,stakeAmount)
                const deployerBalanceBefore = await staker.balanceOf(deployer.address)
                console.log("deployerBalanceBefore: ", deployerBalanceBefore);
                let balanceOfContract = await token.balanceOf(staker.target)
                console.log("balanceOfContract before withdraw:", balanceOfContract);
                const deployerTokenBalanceBefore = await token.balanceOf(deployer.address)
                await new Promise(r => setTimeout(r, 2000));
                await staker.connect(deployer).withdrawAmountFrom(user1.address, withdrawAmount)
                balanceOfContract = await token.balanceOf(staker.target)
                console.log("balanceOfContract after withdraw:", balanceOfContract);
                const deployerBalanceAfter = await staker.balanceOf(deployer.address)
                console.log("user1BalanceAfter:", deployerBalanceAfter);
                const deployerBalance = await staker.balanceOf(deployer.address)
                console.log("deployerBalance:", deployerBalance);
                const delegatorTotal = await staker.balanceOfChannel(user1.address);
                console.log("delegatorTotal:", delegatorTotal);
                const totalStaked = await staker.totalStaked()
                console.log("totalStaked:", totalStaked);
                const delegatorBalance = await staker.balanceForChannel(deployer.address,user1.address)
                const deployerTokenBalanceAfter = await token.balanceOf(deployer.address)
                assert.isAbove(Number(deployerTokenBalanceAfter.toString()), Number(deployerTokenBalanceBefore.toString()))
                assert.equal(deployerBalanceAfter, stakedAmount)
                assert.equal(delegatorTotal, stakedAmount)
                assert.equal(totalStaked, stakedAmount)
                assert.equal(delegatorBalance, stakedAmount)
            })
            it("Should be able to withdraw tokens successfully to an address", async () => {
                //const stakeAmount = ethers.parseEther("1000")
                //await token.approve(staker.target,stakeAmount)
                //await staker.connect(deployer).stakeFor(user1.address,stakeAmount)
                const deployerBalanceBefore = await staker.balanceOf(deployer.address)
                console.log("user1Balance before:", deployerBalanceBefore);
                let balanceOfContract = await token.balanceOf(staker.target)
                console.log("balanceOfContract before withdraw:", balanceOfContract);
                const deployerTokenBalanceBefore = await token.balanceOf(deployer.address)
                await new Promise(r => setTimeout(r, 2000));
                await staker.connect(deployer).withdrawFrom(user1.address)
                balanceOfContract = await token.balanceOf(staker.target)
                console.log("balanceOfContract after withdraw:", balanceOfContract);
                const deployerBalanceAfter = await staker.balanceOf(deployer.address)
                console.log("user1BalanceAfter:", deployerBalanceAfter);
                const deployerBalance = await staker.balanceOf(deployer.address)
                console.log("deployerBalance:", deployerBalance);
                const delegatorTotal = await staker.balanceOfChannel(user1.address);
                console.log("delegatorTotal:", delegatorTotal);
                const totalStaked = await staker.totalStaked()
                console.log("totalStaked:", totalStaked);
                const delegatorBalance = await staker.balanceForChannel(deployer.address,user1.address)
                const deployerTokenBalanceAfter = await token.balanceOf(deployer.address)
                assert.isAbove(Number(deployerTokenBalanceAfter.toString()), Number(deployerTokenBalanceBefore.toString()))
                assert.equal(deployerBalanceAfter.toString(), "0")
                assert.equal(delegatorTotal.toString(), "0")
                assert.equal(totalStaked.toString(), "0")
                assert.equal(delegatorBalance.toString(), "0")
            })
            describe("channel rewards", () => {
                it("set rewards for channel", async () => {
                    const duration = 60 * 60 * 24 * 30
                    const reward = ethers.parseEther("0.0000123")
                    await staker.connect(deployer).setRewardRateForChannel(user1.address,reward)
                    await staker.connect(deployer).setRewardDuration(user1.address,duration)
                    const channelReward = (await staker.channelRewards(user1.address)).rewardRate.toString()
                    const channelRewardDuration = (await staker.channelRewards(user1.address)).endTimestamp.toString()
                    console.log("channelReward:", channelReward);
                    assert.equal(channelReward.toString(), ethers.parseEther("0.0000123").toString())
                })
                it("Calculate calculateRewardsForChannel correctly", async () => {
                    const duration = 60 * 60 * 24 * 30
                    const reward = ethers.parseEther("0.0000123")
                    const stakeAmount = ethers.parseEther("1000")
                    await staker.connect(deployer).setRewardRateForChannel(user1.address,reward)
                    await staker.connect(deployer).setRewardDuration(user1.address,duration)
                    await token.approve(staker.target,stakeAmount)
                    await staker.connect(deployer).stakeFor(user1.address,stakeAmount)                   
                    const stakedOnChannel = await staker.balanceOfChannel(user1.address)
                    console.log("stakedOnChannel:", stakedOnChannel);
                    console.log("total staked:", await staker.totalStaked());
                    await new Promise(r => setTimeout(r, 5000));
                    const rewardForChannel = await staker.calculateRewardsForChannel(user1.address)
                    console.log("rewardForChannel:", rewardForChannel);
                    const channelReward = (await staker.channelRewards(user1.address)).rewardRate.toString()
                    console.log("channelReward:", channelReward);
                    const channelRewardDuration = (await staker.channelRewards(user1.address)).endTimestamp.toString()
                    console.log("channelRewardDuration:", channelRewardDuration);                    
                    assert.equal(rewardForChannel.toString(), ethers.parseEther("0.0000133").toString())
                })
            })

        })
    })

