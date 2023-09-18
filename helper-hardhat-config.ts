export interface networkConfigItem {
    blockConfirmations?: number
  }
  
  export interface networkConfigInfo {
    [key: string]: networkConfigItem
  }

export const networkConfig: networkConfigInfo = {
    hardhat: {},
    localhost: {},
    sepolia: {
      blockConfirmations: 6,
    },
  }
  export const INITIAL_SUPPLY = "10000000000"
  export const DOLLAR_SUPPLY = "100"
  export const REWARD_RATE = "0.000001"

  export const ODDIN_TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  
  export const developmentChains = ["hardhat", "localhost"]
  
//   export module.exports = {
//     networkConfig,
//     developmentChains,
//     INITIAL_SUPPLY,
//   }