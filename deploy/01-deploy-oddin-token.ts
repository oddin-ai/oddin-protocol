import { HardhatRuntimeEnvironment } from "hardhat/types";
import {  developmentChains,  INITIAL_SUPPLY, networkConfig} from "../helper-hardhat-config";
import verify from "../utils/verify";

module.exports = async (hre : HardhatRuntimeEnvironment) => {
    const oddinTokenFactory = await hre.ethers.getContractFactory("OddinToken");
    const oddinToken = await oddinTokenFactory.deploy(INITIAL_SUPPLY);
    await oddinToken.waitForDeployment();
    console.log("OddinToken deployed to:", oddinToken.target);
    // // @ts-ignore
    // const { deployments, getNamedAccounts, network } = hre;
    // const { deploy, log } = deployments
    // const { deployer } = await getNamedAccounts()
    // const oddinToken = await deploy("OddinToken", {
    //     from: deployer,
    //     args: [INITIAL_SUPPLY],
    //     log: true,
    //     // we need to wait if on a live network so we can verify properly
    //     waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    // })
    // log(`ourToken deployed at ${oddinToken.address}`);

    if (!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(oddinToken.target.toString(), [INITIAL_SUPPLY])
    }
}

module.exports.tags = ["all", "token"]
