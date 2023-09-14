import  { assert, expect } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, INITIAL_SUPPLY } from "../../helper-hardhat-config";
import { SimpleToken } from "../../typechain-types";
import { Address } from "hardhat-deploy/dist/types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SimpleToken Unit Test", function () {
          //Multipler is used to make reading the math easier because of the 18 decimal points
          const multiplier = 10 ** 18
          let simpleToken : SimpleToken;
          let deployer : Address;
          let user1 : Address;
          beforeEach(async function () {
              const accounts = await getNamedAccounts()
              deployer = accounts.deployer
              user1 = accounts.user1

              await deployments.fixture("all")
              simpleToken = await ethers.getContractAt("SimpleToken", deployer)
          })
          it("was deployed", async () => {
              assert(simpleToken.target)
          })
          describe("constructor", () => {
              it("Should have correct INITIAL_SUPPLY of token ", async () => {
                  const totalSupply = await simpleToken.totalSupply()
                  assert.equal(totalSupply.toString(), INITIAL_SUPPLY)
              })
              it("initializes the token with the correct name and symbol ", async () => {                
                const name = (await simpleToken.name()).toString()
                assert.equal(name, "SimpleToken")

                const symbol = (await simpleToken.symbol()).toString()
                assert.equal(symbol, "ODDN")
              })
              it("initializes the token with the correct owner ", async () => {
                const owner = (await simpleToken.owner()).toString()
                assert.equal(owner, deployer)
              })
          })
          describe("transfers", () => {
              it("Should be able to transfer tokens successfully to an address", async () => {
                  const tokensToSend = ethers.parseEther("10")
                  await simpleToken.transfer(user1, tokensToSend)
                  expect(await simpleToken.balanceOf(user1)).to.equal(tokensToSend)
              })
              it("emits an transfer event, when an transfer occurs", async () => {
                  await expect(simpleToken.transfer(user1, (10 * multiplier).toString())).to.emit(
                    simpleToken,
                      "Transfer"
                  )
              })
          })
          describe("allowances", () => {
            let playerToken : SimpleToken;
              const amount = (20 * multiplier).toString()
              beforeEach(async () => {
                  playerToken = await ethers.getContractAt("SimpleToken", user1)
              })
              it("Should approve other address to spend token", async () => {           
                  const tokensToSpend = ethers.parseEther("5")
                  //Deployer is approving that user1 can spend 5 of their precious OT's
                  await simpleToken.approve(user1, tokensToSpend)
                  await playerToken.transferFrom(deployer, user1, tokensToSpend)
                  expect(await playerToken.balanceOf(user1)).to.equal(tokensToSpend)
              })
              it("doesn't allow an unnaproved member to do transfers", async () => {                  
                  await expect(
                      playerToken.transferFrom(deployer, user1, amount)
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
              it("emits an approval event, when an approval occurs", async () => {
                  await expect(simpleToken.approve(user1, amount)).to.emit(simpleToken, "Approval")
              })
              it("the allowance being set is accurate", async () => {
                  await simpleToken.approve(user1, amount)
                  const allowance = await simpleToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("won't allow a user to go over the allowance", async () => {
                  await simpleToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(deployer, user1, (40 * multiplier).toString())
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
          })
      })