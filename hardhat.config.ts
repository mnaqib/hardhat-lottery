import { HardhatUserConfig } from 'hardhat/types'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import 'dotenv/config'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const API_KEY = process.env.API_KEY as string
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY as string

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
        localhost: {
            url: 'http://127.0.0.1:8545/',
            chainId: 31337,
        },
    },
    solidity: '0.8.17',
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        // Your API key for Etherscan
        apiKey: API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: 'gas-report.txt',
        noColors: true,
        currency: 'USD',
        coinmarketcap: COINMARKETCAP_KEY,
        token: 'ETH',
    },
    mocha: {
        timeout: 300000, // 200 seconds
    },
}

export default config
