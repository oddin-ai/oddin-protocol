import { HardhatRuntimeEnvironment } from "hardhat/types";
import {  developmentChains,  DOLLAR_SUPPLY} from "../helper-hardhat-config";
import verify from "../utils/verify";

module.exports = async (hre : HardhatRuntimeEnvironment) => {
    const oddinDollarTokenFactory = await hre.ethers.getContractFactory("OddinDollarToken");
    const oddinDollarToken = await oddinDollarTokenFactory.deploy(DOLLAR_SUPPLY);
    await oddinDollarToken.waitForDeployment();
    console.log("OddinDollarToken deployed to:", oddinDollarToken.target);

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(oddinDollarToken.target.toString(), [DOLLAR_SUPPLY])
    }
}

module.exports.tags = ["all", "token"]