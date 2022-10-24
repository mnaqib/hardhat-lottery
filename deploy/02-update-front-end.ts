import { ethers, network } from 'hardhat'
import { Raffle } from '../typechain-types'
import fs from 'fs/promises'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const FRONT_END_ADDRESS_FILE =
    '../nextjs-lottery/constants/contractAddresses.json'
const FRONT_END_ABI_FILE = '../nextjs-lottery/constants/abi.json'

const func: DeployFunction = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log('Updating front end...')
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateContractAddresses() {
    const raffle: Raffle = await ethers.getContract('Raffle')
    const chainId = (network.config.chainId as number).toString()
    const currentAddresses = JSON.parse(
        await fs.readFile(FRONT_END_ADDRESS_FILE, 'utf-8')
    )

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address))
            currentAddresses[chainId].push(raffle.address)
    } else {
        currentAddresses[chainId] = [raffle.address]
    }

    await fs.writeFile(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddresses))
}

async function updateAbi() {
    const raffle: Raffle = await ethers.getContract('Raffle')
    await fs.writeFile(
        FRONT_END_ABI_FILE,
        raffle.interface.format(ethers.utils.FormatTypes.json)
    )
}

export default func
func.tags = ['all', 'frontend']
