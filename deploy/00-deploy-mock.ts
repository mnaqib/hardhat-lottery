import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmetChains } from '../helper-hardhat-config'
import { ethers } from 'ethers'

const BASE_FEE = ethers.utils.parseEther('0.25')
const GAS_PRICE_LINK = 1e9

const func: DeployFunction = async ({
    deployments,
    network,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmetChains.includes(network.name)) {
        log('Local network detected deploying mocks')

        //deploy a mock coordinator
        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            args,
            log: true,
        })
        log('Mocks Deployed')
        log('------------------------------------------')
    }
}

export default func
func.tags = ['all', 'mock']
