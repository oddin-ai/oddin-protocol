import { HardhatRuntimeEnvironment } from "hardhat/types";
import {developmentChains, ODDIN_DOLLAR} from "../helper-hardhat-config";
import verify from "../utils/verify";
import { ethers } from "hardhat";


module.exports = async (hre : HardhatRuntimeEnvironment) => {
    const dealManagerFactory = await hre.ethers.getContractFactory("DealManager");
    const dealManager = await dealManagerFactory.deploy(ODDIN_DOLLAR);
    await dealManager.waitForDeployment();
    console.log(`DealManager deployed to:", ${dealManager.target}`);

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(dealManager.target.toString(), [])
    }
}

module.exports.tags = ["all", "contracts", "dealManager"]
