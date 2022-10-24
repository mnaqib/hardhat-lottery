import { ethers, network } from 'hardhat'
import { Raffle, VRFCoordinatorV2Mock } from '../typechain-types'

async function mockKeepers() {
    const raffle: Raffle = await ethers.getContract('Raffle')
    const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(''))
    const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
    const time = (await raffle.getLatestTimeStamp()).toString()

    console.log({ time })

    if (upkeepNeeded) {
        const tx = await raffle.performUpkeep([])
        const receipt = await tx.wait(1)
        const events = receipt.events!
        const requestId = events[1].args?.requestId

        console.log('Upkeep performed with req id:', requestId)

        if (network.config.chainId === 31337) {
            await mockVRF(requestId, raffle)
        }
    } else {
        console.log('No upkeep needed')
    }
}

async function mockVRF(reqId: string, raffle: Raffle) {
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
        'VRFCoordinatorV2Mock'
    )
    await vrfCoordinatorV2Mock.fulfillRandomWords(reqId, raffle.address)
    console.log('responded')

    const recentWinner = await raffle.getRecentWinner()
    console.log(`The winner is: ${recentWinner}`)
}

mockKeepers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
