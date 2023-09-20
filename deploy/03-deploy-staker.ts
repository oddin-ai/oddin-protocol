import { HardhatRuntimeEnvironment } from "hardhat/types";
import {  REWARD_RATE, developmentChains, ODDIN_TOKEN} from "../helper-hardhat-config";
import verify from "../utils/verify";
import { ethers } from "hardhat";


module.exports = async (hre : HardhatRuntimeEnvironment) => {
    const reward = ethers.parseEther(REWARD_RATE);
    const stakerFactory = await hre.ethers.getContractFactory("Staker");
    const staker = await stakerFactory.deploy(reward,ODDIN_TOKEN);
    await staker.waitForDeployment();
    console.log(`Staker deployed to:", ${staker.target}, with reward rate: ${reward}`);

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(staker.target.toString(), [])
    }
}

module.exports.tags = ["all", "contracts", "staker"]
