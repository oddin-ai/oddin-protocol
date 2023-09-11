import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config"
import "@typechain/hardhat"

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const TESTING_PRIVATE_KEY = process.env.TESTING_PRIVATE_KEY || "";

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [ADMIN_PRIVATE_KEY],
      chainId: 11155111,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [TESTING_PRIVATE_KEY],
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  solidity: "0.8.19",
};

// const config: HardhatUserConfig = {
//   defaultNetwork: "hardhat",
//   networks: {
//     sopelia: {
//       url: SOPELIA_RPC_URL,
//       accounts: [ ADMIN_PRIVATE_KEY ],
//       chainId: 11155111,
//     }
//   },
//   solidity: "0.8.19",
// };

// export default config;

