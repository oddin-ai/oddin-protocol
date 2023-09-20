import { expect, assert } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, DOLLAR_SUPPLY} from "../../helper-hardhat-config";
import { OddinDollarToken, DealManager, DealManager__factory } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DealManager Unit tests", function () {
        let dealManager: DealManager;
        let dollarToken : OddinDollarToken;
        let deployer: any;
        let user1: any;
        let channel: any;
        let buyer: any;
        this.beforeAll(async function () {
            [deployer, user1, channel, buyer] = await ethers.getSigners();
            dollarToken = await ethers.deployContract("OddinDollarToken", [DOLLAR_SUPPLY], deployer)
            dealManager = await ethers.deployContract("DealManager", [dollarToken.target], deployer)
        })
        it("was deployed", async () => {
            console.log("staker address:", dealManager.target);
            assert(dealManager.target)
        })
        describe("constructor tests", function () {
            it("should set dollar token address", async () => {
                expect(await dealManager.dollarToken()).to.equal(dollarToken.target)
            })
            it("should set owner", async () => {
                expect(await dealManager.owner()).to.equal(deployer.address)
            })
        })
        describe("Deal tests", function () {
            this.beforeAll(async function () {
                const dealAmount = ethers.parseEther("1000");
                await dollarToken.approve(deployer.address, dealAmount)
                await dollarToken.transferFrom(deployer.address, buyer.address, dealAmount)
            })
            it("should create deal", async () => {
                const dealAmount = ethers.parseEther("100")                
                await dollarToken.connect(buyer).approve(dealManager.target, dealAmount)
                await dealManager.connect(buyer).createDeal(1, dealAmount,channel.address,1,0)
                const [id] = await dealManager.getDeal(buyer.address,channel.address)
                expect(id).to.equal(1)
            })
            it("should not create deal if not enough funds", async () => {
                const dealAmount = ethers.parseEther("2000")                
                await dollarToken.connect(buyer).approve(dealManager.target, dealAmount)
                await expect(dealManager.connect(buyer).createDeal(2, dealAmount,channel.address,1,0)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
            })
            it("should not create a deal if contract is paused", async () => {
                const dealAmount = ethers.parseEther("100")                
                await dollarToken.connect(buyer).approve(dealManager.target, dealAmount)
                await dealManager.pauseContract()
                await expect(dealManager.connect(buyer).createDeal(3, dealAmount,channel.address,1,0)).to.be.revertedWith("Pausable: paused")
            })
            it("Should be able to claim payment", async () => {
                const dealAmount = ethers.parseEther("100")                
                await dollarToken.connect(buyer).approve(dealManager.target, dealAmount)
                await dealManager.connect(buyer).createDeal(4, dealAmount,channel.address,1,0)
                await dealManager.updateDealStatus(buyer.address,channel.address,1)
                await expect(await dealManager.connect(channel).claimPayment(buyer.address)).to.emit(dealManager, "ClaimEvent")
            })
            this.afterEach(async function () {
                await dealManager.unpauseContract()
            })
        })
    })