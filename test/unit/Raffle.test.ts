import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { developmetChains, networkConfig } from '../../helper-hardhat-config'
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert } from 'chai'

!developmetChains.includes(network.name)
    ? describe.skip
    : describe('Raffle', async () => {
          let raffle: Raffle
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock

          const chainId = network.config.chainId as number

          beforeEach(async () => {
              const { deployer } = await getNamedAccounts()
              await deployments.fixture(['all'])
              raffle = await ethers.getContract('Raffle', deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  'VRFCoordinatorV2Mock',
                  deployer
              )
          })

          describe('constructor', async () => {
              it('initializes the raffle correctly', async () => {
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()

                  assert.equal(raffleState.toString(), '0')
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId].interval
                  )
              })
          })
      })
