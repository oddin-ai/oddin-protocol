import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";
import "hardhat-deploy";  
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const TESTING_PRIVATE_KEY = process.env.TESTING_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [ADMIN_PRIVATE_KEY],
      chainId: 11155111,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [ADMIN_PRIVATE_KEY],
      chainId: 5,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user1: {
      default: 1,
    }
  },
  solidity: "0.8.19",
};

export default config;

