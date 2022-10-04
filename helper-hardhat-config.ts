import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

export const networkConfig: {
    [key: number]: {
        name: string
        vrfCoordinator?: string
        entranceFee: BigNumber
        gasLane: string
        subId: string
        callbackGasLimit: string
        interval: string
    }
} = {
    5: {
        name: 'goerli',
        vrfCoordinator: '0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d',
        entranceFee: ethers.utils.parseEther('0.01'),
        gasLane:
            '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
        subId: '3162',
        callbackGasLimit: '500000',
        interval: '30',
    },
    31337: {
        name: 'hardhat',
        entranceFee: ethers.utils.parseEther('0.01'),
        gasLane:
            '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
        subId: '0',
        callbackGasLimit: '500000',
        interval: '30',
    },
}

export const developmetChains = ['hardhat', 'localhost']
export const DECIMALS = 8
export const INITIAL_ANSWER = 2000000000000
