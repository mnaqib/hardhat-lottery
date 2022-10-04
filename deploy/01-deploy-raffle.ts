import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmetChains, networkConfig } from '../helper-hardhat-config'
import { ethers } from 'hardhat'
import { VRFCoordinatorV2Mock } from '../typechain-types/@chainlink/contracts/src/v0.8/mocks'
import 'dotenv/config'
import { verify } from '../utils/verify'

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther('10')

const func: DeployFunction = async ({
    deployments,
    network,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId as number
    let vrfCoordinatorAddress: string
    let subscriptionId: string

    if (developmetChains.includes(network.name)) {
        const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
            await ethers.getContract('VRFCoordinatorV2Mock')

        vrfCoordinatorAddress = VRFCoordinatorV2Mock.address
        const transactionResponse =
            await VRFCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        const events = transactionReceipt.events!
        subscriptionId = events[0].args?.subId!
        await VRFCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        )
    } else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinator!
        subscriptionId = networkConfig[chainId].subId
    }

    const entranceFee = networkConfig[chainId].entranceFee
    const gasLane = networkConfig[chainId].gasLane
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit
    const interval = networkConfig[chainId].interval

    const args = [
        vrfCoordinatorAddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy('Raffle', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: developmetChains.includes(network.name) ? 1 : 6,
    })

    if (developmetChains.includes(network.name)) {
        const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
            await ethers.getContract('VRFCoordinatorV2Mock')

        await VRFCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    }

    if (!developmetChains.includes(network.name) && process.env.API_KEY) {
        log('verifying.....')
        await verify(raffle.address, args)
    }
    log('----------------------------------------------------')
}

export default func
func.tags = ['all', 'raffle']
