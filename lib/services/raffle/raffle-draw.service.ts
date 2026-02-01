/**
 * Raffle Draw Service
 *
 * Handles draw initiation only.
 * Winner selection happens ON-CHAIN via Chainlink VRF.
 * Winners are recorded via blockchain event listeners.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import type { DrawInitiationResult, WinnerSelectionResult } from '../types';
import {
  RaffleNotFoundError,
  NoEntriesForDrawError,
  RaffleAlreadyDrawnError,
} from '../errors';
import {
  validateRaffleDrawable,
} from './raffle-validation.service';
import { requestRandomness } from './raffle-blockchain.service';

/**
 * Initiate raffle draw with VRF request
 *
 * Business Rules:
 * - Raffle must be in active or ending status
 * - Raffle end time must have passed
 * - Must have at least 1 entry
 * - Can only draw once per raffle
 *
 * Flow:
 * 1. Validate raffle state
 * 2. Change status to 'drawing'
 * 3. Request randomness from Chainlink VRF (triggers on-chain draw)
 * 4. Store VRF request ID
 * 5. Contract will select winners and pay them automatically
 * 6. Event listener will record winners when WinnersSelected event fires
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws RaffleNotDrawableError if raffle cannot be drawn
 * @throws RaffleAlreadyDrawnError if raffle already drawn
 */
export async function initiateRaffleDraw(
  raffleId: string,
  chainId: number = 137
): Promise<DrawInitiationResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Check if already drawn
  if (raffle.status === 'drawing' || raffle.status === 'completed') {
    throw new RaffleAlreadyDrawnError(raffleId);
  }

  // Get entry count
  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  if (entries.length === 0) {
    throw new NoEntriesForDrawError(raffleId);
  }

  // Validate drawable
  validateRaffleDrawable(raffle, entries.length);

  // Update status to drawing
  await raffleRepo.update(raffleId, {
    status: 'drawing',
  });

  // Request randomness from VRF (triggers on-chain draw)
  // Contract will:
  // 1. Request random number from Chainlink VRF
  // 2. Receive callback with random number
  // 3. Select winners ON-CHAIN
  // 4. Pay winners AUTOMATICALLY
  // 5. Emit WinnersSelected event
  const vrfResult = await requestRandomness(
    raffleId,
    chainId
  );

  // Store VRF request ID
  await raffleRepo.update(raffleId, {
    vrfRequestId: vrfResult.requestId,
  });

  return {
    raffleId,
    vrfRequestId: vrfResult.requestId,
    status: 'drawing',
    timestamp: Date.now(),
  };
}

/**
 * Get winners for a completed raffle
 *
 * This function READS winners that were already selected by the contract
 * and recorded by the event listener. It does NOT select winners.
 *
 * @deprecated This is now just a data retrieval function.
 * Winners are selected on-chain and recorded via WinnersSelected event listener.
 */
export async function getDrawResults(
  raffleId: string
): Promise<WinnerSelectionResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get winners that were recorded by event listener
  const winnersResult = await winnerRepo.getByRaffle(raffleId);

  return {
    raffleId,
    winners: winnersResult.items,
    randomNumber: raffle.vrfRandomWord || '0',
    timestamp: Date.now(),
  };
}
