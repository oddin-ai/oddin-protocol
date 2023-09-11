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
  
  export const developmentChains = ["hardhat", "localhost"]
  
//   export module.exports = {
//     networkConfig,
//     developmentChains,
//     INITIAL_SUPPLY,
//   }