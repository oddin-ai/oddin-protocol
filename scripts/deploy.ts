import '@nomicfoundation/hardhat-ethers';
import { ethers } from 'hardhat';

async function main() {
  const EventLoggerFactory = await ethers.getContractFactory("EventLogger");
  console.log("Deploying contract...");
  const eventLogger = await EventLoggerFactory.deploy();
  await eventLogger.waitForDeployment();
  console.log(`Contract EventLogger deployed at: ${eventLogger.target}`);
  await eventLogger.log("something stupid");
  const staker = await ethers.deployContract("Staker");
  await staker.waitForDeployment();
  console.log(`Contract Staker deployed at: ${staker.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
