import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { developmetChains, networkConfig } from '../../helper-hardhat-config'
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert, expect } from 'chai'
import { BigNumber } from 'ethers'

!developmetChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Unit Tests', () => {
          let deployer: string
          let raffle: Raffle
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
          let entranceFee: BigNumber
          let interval: number

          const chainId = network.config.chainId as number

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(['all'])
              raffle = await ethers.getContract('Raffle')
              vrfCoordinatorV2Mock = await ethers.getContract(
                  'VRFCoordinatorV2Mock'
              )
              entranceFee = await raffle.getEntranceFee()
              interval = (await raffle.getInterval()).toNumber()
          })

          describe('constructor', () => {
              it('initializes the raffle correctly', async () => {
                  const raffleState = await raffle.getRaffleState()

                  assert.equal(raffleState.toString(), '0')
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId].interval
                  )
              })
          })

          describe('enterRaffle', () => {
              it('reverts when you dont pay enough', async () => {
                  await expect(
                      raffle.enterRaffle()
                  ).to.be.revertedWithCustomError(
                      raffle,
                      'Raffle__NotEnoughETHEntered'
                  )
              })

              it('records players when they enter', async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  const playerFromContract = await raffle.getPlayer(0)

                  assert.equal(playerFromContract, deployer)
              })

              it('emits event on enter', async () => {
                  await expect(
                      raffle.enterRaffle({ value: entranceFee })
                  ).to.emit(raffle, 'RaffleEnter')
              })

              it('does not allow entrance when raffle is calculating', async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])

                  // await network.provider.request({method: 'evm_mine', params: []})

                  // we pretend to be chainlink keeper
                  await raffle.performUpkeep([])
                  await expect(
                      raffle.enterRaffle({ value: entranceFee })
                  ).to.be.revertedWithCustomError(raffle, 'Raffle__NotOpen')
              })
          })

          describe('checkUpKeep', () => {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      []
                  )
                  assert(!upkeepNeeded)
              })

              it("returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])
                  await raffle.performUpkeep([])

                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      []
                  )

                  assert.equal(raffleState.toString(), '1')
                  assert.equal(upkeepNeeded, false)
              })

              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval - 10,
                  ])
                  await network.provider.send('evm_mine', [])

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      []
                  )
                  assert(!upkeepNeeded)
              })

              it('returns true if enough time has passed, has players, ETH, and is open', async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      []
                  )
                  assert(upkeepNeeded)
              })
          })

          describe('performUpKeep', () => {
              it('it can only run if checkupkeep is true', async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])

                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })

              it('it reverts when checkUpkeep is false', async () => {
                  await expect(
                      raffle.performUpkeep([])
                  ).to.be.revertedWithCustomError(
                      raffle,
                      'Raffle__UpkeepNotNeeded'
                  )
              })

              it('Updates the raffle state, emits an event and calls the VRF coordinator', async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])

                  const tx = await raffle.performUpkeep([])
                  const txReceipt = await tx.wait(1)
                  const events = txReceipt.events!
                  const requestId = events[1].args?.requestId
                  const raffleState = await raffle.getRaffleState()

                  assert(requestId.toNumber() > 0)
                  assert(raffleState === 1)
              })
          })

          describe('fulfillRandomWords', () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send('evm_increaseTime', [
                      interval + 1,
                  ])
                  await network.provider.send('evm_mine', [])
              })

              it('can only be called after performUpkeep', async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith('nonexistent request')

                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith('nonexistent request')
              })

              it('picks a winner, resets the lottery and sends money', async () => {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1
                  const accounts = await ethers.getSigners()

                  for (
                      let i = startingAccountIndex;
                      i <= additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({
                          value: entranceFee,
                      })
                  }

                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const winnerStartingBalance = await accounts[1].getBalance()

                  await new Promise(async (resolve, reject) => {
                      //setting up the listerner
                      raffle.once('WinnerPicked', async () => {
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp =
                                  await raffle.getLatestTimeStamp()
                              const numPlayers =
                                  await raffle.getNumberOfPlayers()
                              const winnerEndingBal =
                                  await accounts[1].getBalance()

                              console.log({
                                  recentWinner,
                                  accounts: accounts
                                      .splice(0, 4)
                                      .map((account) => account.address),
                              })

                              assert.equal(numPlayers.toString(), '0')
                              assert.equal(raffleState.toString(), '0')
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerEndingBal.toString(),
                                  winnerStartingBalance
                                      .add(
                                          entranceFee
                                              .mul(additionalEntrants)
                                              .add(entranceFee)
                                      )
                                      .toString()
                              )
                          } catch (error) {
                              reject(error)
                          }

                          resolve(() => {
                              console.log('winnerPicked')
                          })
                      })

                      //we will fire the event and listerner will pick it up and resolve.
                      const tx = await raffle.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      const events = txReceipt.events!

                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          events[1].args?.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
