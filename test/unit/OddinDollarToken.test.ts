import  { assert, expect } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, DOLLAR_SUPPLY } from "../../helper-hardhat-config";
import { OddinDollarToken } from "../../typechain-types";
//import { Address } from "hardhat-deploy/dist/types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("OddinDollarToken Unit Test", function () {
          //Multipler is used to make reading the math easier because of the 18 decimal points
          const multiplier = 10 ** 18
          let OddinDollarToken : OddinDollarToken;
          let deployer : any;
          let user1 : any;
          beforeEach(async function () {
            //   const accounts = await getNamedAccounts()
            //   deployer = accounts.deployer
            //   user1 = accounts.user1
              //const signer = await ethers.getSigner(deployer.toString())
            [deployer, user1] = await ethers.getSigners();
              //  const OddinDollarToken = await ethers.deployContract("OddinDollarToken");
              OddinDollarToken = await ethers.deployContract("OddinDollarToken", [DOLLAR_SUPPLY],deployer)   // ?????????????????????????????????????????????????????????
              //OddinDollarToken = await ethers.getContract("OddinDollarToken", deployer)
            
              
              
            //   await deployments.fixture("all")
            //   const myContract = await deployments.get("OddinDollarToken")
            //   OddinDollarToken = await ethers.getContractAt(myContract.abi, myContract.address, signer)

              console.log("signer:", deployer.address);  
              
          })
          it("was deployed", async () => {
            console.log("OddinDollarToken address:", OddinDollarToken.target);
              assert(OddinDollarToken.target)
          })
          describe("constructor", () => {
              it("Should have correct INITIAL_SUPPLY of token ", async () => {
                  const totalSupply = await OddinDollarToken.totalSupply()
                  console.log("totalSupply:", totalSupply);
                  assert.equal(totalSupply.toString(), ethers.parseEther(DOLLAR_SUPPLY).toString())
              })
              it("initializes the token with the correct name and symbol ", async () => {                
                const name = (await OddinDollarToken.name()).toString()
                console.log("name:", name);
                assert.equal(name, "OddinDollarToken")

                const symbol = (await OddinDollarToken.symbol()).toString()
                console.log("symbol:", symbol);
                assert.equal(symbol, "dODDN")
              })
              it("initializes the token with the correct owner ", async () => {
                const owner = (await OddinDollarToken.owner()).toString()
                console.log("owner:", owner);
                console.log("deployer:", deployer);
                assert.equal(owner, deployer.address)
              })
          })
          describe("transfers", () => {
              it("Should be able to transfer tokens successfully to an address", async () => {
                  const tokensToSend = ethers.parseEther("10")
                  console.log("user1:", user1);
                  console.log("tokensToSend:", tokensToSend);
                  await OddinDollarToken.transfer(user1, tokensToSend)
                  const balance = await OddinDollarToken.balanceOf(user1)
                  console.log("balance:", balance);
                  expect(balance).to.equal(tokensToSend)
              })
              it("emits an transfer event, when an transfer occurs", async () => {
                  await expect(OddinDollarToken.transfer(user1, (10 * multiplier).toString())).to.emit(
                    OddinDollarToken,
                      "Transfer"
                  )
              })
          })
          describe("mint and burn", () => {
            let oddinDollarToken : OddinDollarToken;
            beforeEach(async () => {
              //  let user1Signer = await ethers.getSigner(user1)
              oddinDollarToken = await ethers.deployContract("OddinDollarToken",[DOLLAR_SUPPLY], deployer)
            })
            it("Should be able to mint tokens successfully to an address", async () => {
                const tokensToMint = ethers.parseEther("10")
                console.log("user1:", user1);
                console.log("tokensToMint:", tokensToMint);
                await OddinDollarToken.mint(user1, tokensToMint)
                const balance = await OddinDollarToken.balanceOf(user1)
                console.log("balance:", balance);
                expect(balance).to.equal(tokensToMint)
            })
            it("emits an mint event, when an mint occurs", async () => {
                await expect(OddinDollarToken.mint(user1, (10 * multiplier).toString())).to.emit(
                    OddinDollarToken,
                    "Transfer"
                )
            })
            it("Should be able to burn tokens successfully to an address", async () => {
              const tokensToBurn = ethers.parseEther("10")
              let balancebefore = await OddinDollarToken.balanceOf(deployer)
              await oddinDollarToken.approve(deployer.address, tokensToBurn)
              await oddinDollarToken.burnFrom(deployer,tokensToBurn)
              let balanceAfter = await oddinDollarToken.balanceOf(deployer)
              const totalSupply = await oddinDollarToken.totalSupply()
              expect(balanceAfter).to.lessThan(balancebefore)
              expect(totalSupply).to.lessThan(ethers.parseEther(DOLLAR_SUPPLY.toString()))
          })
          })
          describe("allowances", () => {
            let playerToken : OddinDollarToken;
              const amount = (20 * multiplier).toString()
              beforeEach(async () => {
                //  let user1Signer = await ethers.getSigner(user1)
                  playerToken = await ethers.deployContract("OddinDollarToken",[DOLLAR_SUPPLY], user1)
              })
              it("Should approve other address to spend token", async () => {           
                  const tokensToSpend = ethers.parseEther("5")
                  //Deployer is approving that user1 can spend 5 of their precious OT's
                  await playerToken.approve(user1, tokensToSpend)
                  await playerToken.transferFrom(user1, deployer, tokensToSpend)
                  const balance = await playerToken.balanceOf(deployer)
                  expect(balance).to.equal(tokensToSpend)
              })
              it("doesn't allow an unnaproved member to do transfers", async () => {                  
                  await expect(
                      playerToken.transferFrom(deployer, user1, amount)
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
              it("emits an approval event, when an approval occurs", async () => {
                  await expect(OddinDollarToken.approve(user1, amount)).to.emit(OddinDollarToken, "Approval")
              })
              it("the allowance being set is accurate", async () => {
                  await OddinDollarToken.approve(user1, amount)
                  const allowance = await OddinDollarToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("won't allow a user to go over the allowance", async () => {
                  await OddinDollarToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(deployer, user1, (40 * multiplier).toString())
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
          })
      })