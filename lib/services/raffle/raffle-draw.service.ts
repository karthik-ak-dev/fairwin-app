/**
 * Raffle Draw Service
 *
 * Handles winner selection and draw process.
 * Integrates with Chainlink VRF for provably fair randomness.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import type { EntryItem } from '@/lib/db/models';
import type { DrawInitiationResult, WinnerSelectionResult } from '../types';
import {
  RaffleNotFoundError,
  NoEntriesForDrawError,
  RaffleAlreadyDrawnError,
} from '../errors';
import {
  validateRaffleDrawable,
} from './raffle-validation.service';
import * as contractWriteService from '../blockchain/contract-write.service';

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
 * 3. Request randomness from Chainlink VRF
 * 4. Store VRF request ID
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

  // Request randomness from VRF
  const vrfResult = await contractWriteService.requestRandomness(
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
 * Select winners using weighted random selection
 *
 * Called by VRF callback after randomness is fulfilled
 *
 * Algorithm:
 * - Creates pool where each entry is represented numEntries times
 * - Uses random seed to select winners from pool
 * - Ensures no duplicate winners
 */
export function selectWinnersWeighted(
  entries: EntryItem[],
  randomSeed: bigint,
  winnerCount: number
): string[] {
  // Build weighted pool
  const pool: string[] = [];
  const participantMap = new Map<string, number>();

  // Aggregate entries by wallet
  for (const entry of entries) {
    const current = participantMap.get(entry.walletAddress) || 0;
    participantMap.set(entry.walletAddress, current + entry.numEntries);
  }

  // Add to pool based on entry count (weight)
  const participantEntries = Array.from(participantMap.entries());
  for (const [wallet, count] of participantEntries) {
    for (let i = 0; i < count; i++) {
      pool.push(wallet);
    }
  }

  const winners: string[] = [];
  const selectedWallets = new Set<string>();
  let currentSeed = randomSeed;

  // Select winners
  for (let i = 0; i < winnerCount && pool.length > 0; i++) {
    // Get index using current seed
    const index = Number(currentSeed % BigInt(pool.length));
    const winner = pool[index];

    // Ensure no duplicates
    if (!selectedWallets.has(winner)) {
      winners.push(winner);
      selectedWallets.add(winner);

      // Remove all entries for this winner from pool
      const filteredPool = pool.filter((addr) => addr !== winner);
      pool.length = 0;
      pool.push(...filteredPool);
    }

    // Update seed for next iteration
    currentSeed = BigInt('0x' + hashBigInt(currentSeed));
  }

  return winners;
}

/**
 * Complete raffle draw with random number
 *
 * Called after VRF fulfillment with the random number
 * Selects winners and updates raffle status to completed
 */
export async function completeRaffleDraw(
  raffleId: string,
  randomNumber: bigint
): Promise<WinnerSelectionResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get all entries
  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  // Select winners using weighted algorithm
  const winnerAddresses = selectWinnersWeighted(entries, randomNumber, raffle.winnerCount);

  // Calculate prize amounts (equal distribution for now)
  const prizePerWinner = Math.floor(raffle.winnerPayout / raffle.winnerCount);

  // Create winner records
  const winners = await Promise.all(
    winnerAddresses.map((walletAddress, index) =>
      winnerRepo.create({
        raffleId,
        walletAddress,
        ticketNumber: 0, // Will be set by actual ticket selection logic
        totalTickets: raffle.totalEntries,
        prize: prizePerWinner,
        tier: `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}`,
      })
    )
  );

  // Update raffle status to completed
  await raffleRepo.update(raffleId, {
    status: 'completed',
    vrfRandomWord: randomNumber.toString(),
  });

  return {
    raffleId,
    winners,
    randomNumber: randomNumber.toString(),
    timestamp: Date.now(),
  };

}
/**
 * Simple hash function for bigint
 */
function hashBigInt(value: bigint): string {
  const str = value.toString();
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).padStart(16, '0');
}
