import '@nomicfoundation/hardhat-ethers';
import { ethers } from 'hardhat';

async function main() {
    const oddinDollarTokenFactory = await ethers.getContractFactory("OddinUSDToken");
    const OddinDollarToken = await oddinDollarTokenFactory.deploy();
    await OddinDollarToken.waitForDeployment();
    console.log(`Contract OddinToken deployed at: ${OddinDollarToken.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});