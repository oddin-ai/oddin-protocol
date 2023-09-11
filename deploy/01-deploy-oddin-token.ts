import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {developmentChains,INITIAL_SUPPLY,networkConfig} from "../helper-hardhat-config";
import verify from "../utils/verify";
import { network } from "hardhat";


module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const oddinToken = await deploy("OddinToken", {
        from: deployer,
        args: [INITIAL_SUPPLY],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations,
      })
      log(`oddinToken deployed at ${oddinToken.address}`);
    
      if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY
      ) {
        await verify(oddinToken.address, [INITIAL_SUPPLY])
      }
}