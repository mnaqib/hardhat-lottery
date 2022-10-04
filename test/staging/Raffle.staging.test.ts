import { ethers, getNamedAccounts, network } from 'hardhat'
import { developmetChains } from '../../helper-hardhat-config'
import { Raffle } from '../../typechain-types'
import { assert, expect } from 'chai'
import { BigNumber } from 'ethers'

developmetChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Staging Tests', () => {
          let deployer: string
          let raffle: Raffle
          let entranceFee: BigNumber
          //   let interval: number

          const chainId = network.config.chainId as number

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              raffle = await ethers.getContract('Raffle')
              entranceFee = await raffle.getEntranceFee()
              //   interval = (await raffle.getInterval()).toNumber()
          })

          describe('fulfillRandomWords', () => {
              it('works with live chainlink keepers and chainlink VRF, we get a random winner', async () => {
                  console.log('test started')
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  //   let winnerStartingBalance: BigNumber

                  await new Promise<void>(async (resolve, reject) => {
                      //setting up the listerner
                      raffle.once('WinnerPicked', async () => {
                          console.log('WinnerPicked event fired')
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp =
                                  await raffle.getLatestTimeStamp()

                              const winnerEndingBal =
                                  await accounts[0].getBalance()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(raffleState, 0)
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerEndingBal.toString(),
                                  winnerStartingBalance
                                      .add(entranceFee)
                                      .toString()
                              )
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })

                      const tx = await raffle.enterRaffle({
                          value: entranceFee,
                      })
                      await tx.wait(6)
                      const winnerStartingBalance =
                          await accounts[0].getBalance()
                      console.log('Entered contest')
                  })
              })
          })
      })
