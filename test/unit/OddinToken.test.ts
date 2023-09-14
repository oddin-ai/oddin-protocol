import  { assert, expect } from "chai";
import { network, getNamedAccounts, deployments, ethers } from "hardhat";
import { developmentChains, INITIAL_SUPPLY } from "../../helper-hardhat-config";
import { OddinToken } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("OddinToken Unit Test", function () {
          //Multipler is used to make reading the math easier because of the 18 decimal points
          const multiplier = 10 ** 18
          let OddinToken : OddinToken;
          let deployer : any;
          let user1 : any;
          beforeEach(async function () {
            //   const accounts = await getNamedAccounts()
            //   deployer = accounts.deployer
            //   user1 = accounts.user1
              //const signer = await ethers.getSigner(deployer.toString())
            [deployer, user1] = await ethers.getSigners();
              //  const OddinToken = await ethers.deployContract("OddinToken");
              OddinToken = await ethers.deployContract("OddinToken", [INITIAL_SUPPLY],deployer)   // ?????????????????????????????????????????????????????????
              //OddinToken = await ethers.getContract("OddinToken", deployer)
            
              
              
            //   await deployments.fixture("all")
            //   const myContract = await deployments.get("OddinToken")
            //   OddinToken = await ethers.getContractAt(myContract.abi, myContract.address, signer)

              console.log("signer:", deployer.address);  
              
          })
          it("was deployed", async () => {
            console.log("OddinToken address:", OddinToken.target);
              assert(OddinToken.target)
          })
          describe("constructor", () => {
              it("Should have correct INITIAL_SUPPLY of token ", async () => {
                  const totalSupply = await OddinToken.totalSupply()
                  console.log("totalSupply:", totalSupply);
                  assert.equal(totalSupply.toString(), ethers.parseEther(INITIAL_SUPPLY).toString())
              })
              it("initializes the token with the correct name and symbol ", async () => {                
                const name = (await OddinToken.name()).toString()
                console.log("name:", name);
                assert.equal(name, "OddinToken")

                const symbol = (await OddinToken.symbol()).toString()
                console.log("symbol:", symbol);
                assert.equal(symbol, "ODDN")
              })
              it("initializes the token with the correct owner ", async () => {
                const owner = (await OddinToken.owner()).toString()
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
                  await OddinToken.transfer(user1, tokensToSend)
                  const balance = await OddinToken.balanceOf(user1)
                  console.log("balance:", balance);
                  expect(balance).to.equal(tokensToSend)
              })
              it("emits an transfer event, when an transfer occurs", async () => {
                  await expect(OddinToken.transfer(user1, (10 * multiplier).toString())).to.emit(
                    OddinToken,
                      "Transfer"
                  )
              })
          })
          describe("mint and burn", () => {
            let oddinToken : OddinToken;
            beforeEach(async () => {
              //  let user1Signer = await ethers.getSigner(user1)
              oddinToken = await ethers.deployContract("OddinToken",[INITIAL_SUPPLY], deployer)
            })
            it("Should be able to mint tokens successfully to an address", async () => {
                const tokensToMint = ethers.parseEther("10")
                console.log("user1:", user1);
                console.log("tokensToMint:", tokensToMint);
                await oddinToken.mint(user1, tokensToMint)
                const balance = await oddinToken.balanceOf(user1)
                console.log("balance:", balance);
                expect(balance).to.equal(tokensToMint)
            })
            it("emits an mint event, when an mint occurs", async () => {
                await expect(oddinToken.mint(user1, (10 * multiplier).toString())).to.emit(
                    oddinToken,
                    "Transfer"
                )
            })
            it("Should be able to burn tokens successfully to an address", async () => {
              const tokensToBurn = ethers.parseEther("10")
              let balancebefore = await oddinToken.balanceOf(deployer)
              await oddinToken.approve(deployer.address, tokensToBurn)
              await oddinToken.burnFrom(deployer,tokensToBurn)
              let balanceAfter = await oddinToken.balanceOf(deployer)
              const totalSupply = await oddinToken.totalSupply()
              expect(balanceAfter).to.lessThan(balancebefore)
              expect(totalSupply).to.lessThan(ethers.parseEther(INITIAL_SUPPLY.toString()))
          })
          })
          describe("allowances", () => {
            let playerToken : OddinToken;
              const amount = (20 * multiplier).toString()
              beforeEach(async () => {
                //  let user1Signer = await ethers.getSigner(user1)
                  playerToken = await ethers.deployContract("OddinToken",[INITIAL_SUPPLY], user1)
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
                  await expect(OddinToken.approve(user1, amount)).to.emit(OddinToken, "Approval")
              })
              it("the allowance being set is accurate", async () => {
                  await OddinToken.approve(user1, amount)
                  const allowance = await OddinToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("won't allow a user to go over the allowance", async () => {
                  await OddinToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(deployer, user1, (40 * multiplier).toString())
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
          })
      })