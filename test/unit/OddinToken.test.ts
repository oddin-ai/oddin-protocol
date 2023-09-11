import  { assert, expect } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, INITIAL_SUPPLY } from "../../helper-hardhat-config";
import { OddinToken } from "../../typechain-types";
import { Address } from "hardhat-deploy/dist/types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("OddinToken Unit Test", function () {
          //Multipler is used to make reading the math easier because of the 18 decimal points
          const multiplier = 10 ** 18
          let oddinToken : OddinToken;
          let deployer : Address;
          let user1 : Address;
          beforeEach(async function () {
              const accounts = await getNamedAccounts()
              deployer = accounts.deployer
              user1 = accounts.user1

              await deployments.fixture("all")
              oddinToken = await ethers.getContractAt("OddinToken", deployer)
          })
          it("was deployed", async () => {
              assert(oddinToken.target)
          })
          describe("constructor", () => {
              it("Should have correct INITIAL_SUPPLY of token ", async () => {
                  const totalSupply = await oddinToken.totalSupply()
                  assert.equal(totalSupply.toString(), INITIAL_SUPPLY)
              })
              it("initializes the token with the correct name and symbol ", async () => {                
                const name = (await oddinToken.name()).toString()
                assert.equal(name, "OddinToken")

                const symbol = (await oddinToken.symbol()).toString()
                assert.equal(symbol, "ODDN")
              })
              it("initializes the token with the correct owner ", async () => {
                const owner = (await oddinToken.owner()).toString()
                assert.equal(owner, deployer)
              })
          })
          describe("transfers", () => {
              it("Should be able to transfer tokens successfully to an address", async () => {
                  const tokensToSend = ethers.parseEther("10")
                  await oddinToken.transfer(user1, tokensToSend)
                  expect(await oddinToken.balanceOf(user1)).to.equal(tokensToSend)
              })
              it("emits an transfer event, when an transfer occurs", async () => {
                  await expect(oddinToken.transfer(user1, (10 * multiplier).toString())).to.emit(
                    oddinToken,
                      "Transfer"
                  )
              })
          })
          describe("allowances", () => {
            let playerToken : OddinToken;
              const amount = (20 * multiplier).toString()
              beforeEach(async () => {
                  playerToken = await ethers.getContractAt("OddinToken", user1)
              })
              it("Should approve other address to spend token", async () => {           
                  const tokensToSpend = ethers.parseEther("5")
                  //Deployer is approving that user1 can spend 5 of their precious OT's
                  await oddinToken.approve(user1, tokensToSpend)
                  await playerToken.transferFrom(deployer, user1, tokensToSpend)
                  expect(await playerToken.balanceOf(user1)).to.equal(tokensToSpend)
              })
              it("doesn't allow an unnaproved member to do transfers", async () => {                  
                  await expect(
                      playerToken.transferFrom(deployer, user1, amount)
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
              it("emits an approval event, when an approval occurs", async () => {
                  await expect(oddinToken.approve(user1, amount)).to.emit(oddinToken, "Approval")
              })
              it("the allowance being set is accurate", async () => {
                  await oddinToken.approve(user1, amount)
                  const allowance = await oddinToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("won't allow a user to go over the allowance", async () => {
                  await oddinToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(deployer, user1, (40 * multiplier).toString())
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
          })
      })