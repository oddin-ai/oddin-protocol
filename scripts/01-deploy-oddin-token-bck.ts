import '@nomicfoundation/hardhat-ethers';
import { ethers, network , run} from 'hardhat';

async function main() {
    //create account with private key and send some ether to it
    const signers = await ethers.getSigners();
    console.log(`Account address: ${signers[0].address}`);

    const owner = new ethers.Wallet(process.env.TESTING_PRIVATE_KEY || "", ethers.provider);
    await signers[0].sendTransaction({to: owner.address, value: ethers.parseEther("100.0")});

    const bal = await ethers.provider.getBalance(owner.address);
    console.log(`Balance of owner: ${bal.toString()}`);
    
    const oddinTokenFactory = await ethers.getContractFactory("OddinToken",owner);
    const OddinToken = await oddinTokenFactory.deploy();
    await OddinToken.waitForDeployment();
    console.log(`Contract OddinToken deployed at: ${OddinToken.target}`);
    console.log(`Contract OddinToken total supply: ${await OddinToken.totalSupply()}`);
    const contractOwner = await OddinToken.owner();
    //await OddinToken.transferOwnership(owner.address);
    //const contractSigner = await OddinToken.owner();
    console.log(`Contract OddinToken owner is: ${contractOwner}`); //, and signer is: ${contractSigner} 
    console.log(`Contract OddinToken owner balance is : ${await OddinToken.balanceOf(owner.address)}`);
   // await OddinToken.mint("0x5FbDB2315678afecb367f032d93F642f64180aa3", 1000);
    const balance = await OddinToken.balanceOf("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    console.log(`Balance of 0x5FbDB2315678afecb367f032d93F642f64180aa3 is: ${balance}`);
   // console.log(network.config);
    if(network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract on Etherscan...");
        await verify(OddinToken.target.toString(), {
            apiKey: process.env.ETHERSCAN_API_KEY,
            contractName: "OddinToken",
            constructorArguments: [],
        });
    }
}

async function verify(address: string, options: any) {
    console.log(`Verifying contract at address: ${address}`);
    try {
        await run("verify:verify", {
            address: address,
            constorArguments: options,
        });
    } 
    catch(e) {
        console.log(e);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});