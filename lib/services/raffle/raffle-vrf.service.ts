/**
 * VRF Callback Service
 *
 * DEPRECATED: This service is no longer needed for winner selection.
 * The smart contract handles VRF callbacks automatically:
 * 1. Contract receives random number in fulfillRandomWords()
 * 2. Contract selects winners ON-CHAIN
 * 3. Contract pays winners AUTOMATICALLY
 * 4. Contract emits WinnersSelected event
 * 5. Event listener records winners in database
 *
 * This file is kept for potential webhook/verification purposes only.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { blockchain } from '@/lib/constants';
import { VRFRequestError } from '../errors';
import { getVRFRequestStatus } from './raffle-blockchain.service';

/**
 * Verify VRF fulfillment happened on-chain
 *
 * This is now primarily for logging/monitoring purposes.
 * The actual winner selection happens automatically in the contract.
 *
 * @param requestId VRF request ID from Chainlink
 * @param chainId Chain ID
 *
 * @throws VRFRequestError if verification fails
 * @deprecated Winner selection now happens automatically on-chain
 */
export async function verifyVRFFulfillment(
  requestId: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<{
  fulfilled: boolean;
  randomNumber: bigint;
  raffleId: string | null;
}> {
  // Verify request on-chain
  const vrfStatus = await getVRFRequestStatus(requestId, chainId);

  if (!vrfStatus.fulfilled) {
    throw new VRFRequestError('VRF request not fulfilled on-chain');
  }

  // Find raffle with this VRF request ID
  const raffle = await findRaffleByVRFRequest(requestId);

  return {
    fulfilled: vrfStatus.fulfilled,
    randomNumber: vrfStatus.randomNumber || BigInt(0),
    raffleId: raffle?.raffleId || null,
  };
}

/**
 * Find raffle by VRF request ID
 *
 * Scans drawing raffles to find one with matching VRF request
 */
async function findRaffleByVRFRequest(requestId: string) {
  // Get all raffles in drawing status
  const result = await raffleRepo.getByStatus('drawing');
  const drawingRaffles = result.items;

  // Find raffle with matching VRF request ID
  return drawingRaffles.find((r) => r.vrfRequestId === requestId) || null;
}
