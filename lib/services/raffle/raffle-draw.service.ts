/**
 * Raffle Draw Service - Simplified for Backend Winner Selection
 *
 * Handles instant winner selection without blockchain VRF.
 * Winners are selected immediately using crypto-secure randomness.
 *
 * Flow:
 * 1. Validate raffle can be drawn
 * 2. Get all entries for raffle
 * 3. Generate random seed (block hash or crypto.random)
 * 4. Select winners deterministically using seed
 * 5. Create winner records with payoutStatus='pending'
 * 6. Update raffle status to 'completed'
 * 7. Create audit log
 *
 * NO VRF, NO blockchain writes, NO event listeners
 */

import { raffleRepo, entryRepo, winnerRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import { RaffleStatus, PayoutStatus } from '@/lib/db/models';
import type { DrawInitiationResult, WinnerSelectionResult } from '../types';
import {
  RaffleNotFoundError,
  NoEntriesForDrawError,
  RaffleAlreadyDrawnError,
} from '../errors';
import {
  validateRaffleDrawable,
} from './raffle-validation.service';
import {
  selectWinnersWithBlockHash,
  selectWinnersWithCrypto,
  type SelectedWinner,
} from './raffle-winner-selection.service';
import { env } from '@/lib/env';

/**
 * Initiate raffle draw with instant winner selection
 *
 * Business Rules:
 * - Raffle must be in active or ending status
 * - Raffle end time must have passed
 * - Must have at least 1 entry
 * - Can only draw once per raffle
 *
 * Flow:
 * 1. Validate raffle state
 * 2. Get all entries
 * 3. Change status to 'drawing'
 * 4. Generate random seed and select winners
 * 5. Create winner records
 * 6. Update user stats
 * 7. Change status to 'completed'
 *
 * @param raffleId Raffle ID to draw
 * @param useBlockHash Use block hash for seed (verifiable) vs crypto random (faster)
 * @returns Draw result with winners
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws RaffleNotDrawableError if raffle cannot be drawn
 * @throws RaffleAlreadyDrawnError if raffle already drawn
 */
export async function initiateRaffleDraw(
  raffleId: string,
  useBlockHash: boolean = true
): Promise<DrawInitiationResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get all entries
  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  // Validate raffle can be drawn (includes all status, time, and entry checks)
  validateRaffleDrawable(raffle, entries.length);

  // Update status to drawing
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.DRAWING,
    drawTime: new Date().toISOString(),
  });

  console.log(`[DrawService] Starting draw for raffle ${raffleId} with ${entries.length} entries`);

  // Select winners using chosen randomness method with prize tiers
  const selectionResult = useBlockHash
    ? await selectWinnersWithBlockHash(entries, raffle.winnerPayout, raffle.prizeTiers, raffle.winnerCount, env.CHAIN_ID)
    : selectWinnersWithCrypto(entries, raffle.winnerPayout, raffle.prizeTiers, raffle.winnerCount);

  console.log(`[DrawService] Selected ${selectionResult.winners.length} winners using ${useBlockHash ? 'block hash' : 'crypto random'}`);

  // Create winner records in database
  await createWinnerRecords(raffleId, selectionResult.winners);

  // Update user stats for all winners
  await updateWinnerStats(raffleId, selectionResult.winners);

  // Update raffle to completed
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.COMPLETED,
    randomSeed: selectionResult.randomSeed,
  });

  console.log(`[DrawService] Draw completed for raffle ${raffleId}`);

  return {
    raffleId,
    winners: selectionResult.winners,
    randomSeed: selectionResult.randomSeed,
    blockHash: selectionResult.blockHash,
    status: RaffleStatus.COMPLETED,
    timestamp: Date.now(),
  };
}

/**
 * Create winner records in database (batch operation for efficiency)
 */
async function createWinnerRecords(raffleId: string, winners: SelectedWinner[]): Promise<void> {
  const winnerInputs = winners.map(winner => ({
    raffleId,
    walletAddress: winner.walletAddress,
    ticketNumber: winner.ticketNumber,
    totalTickets: winner.totalTickets,
    prize: winner.prize,
    tier: winner.tier,
    payoutStatus: PayoutStatus.PENDING, // Admin will send payouts later
  }));

  await winnerRepo.batchCreate(winnerInputs);

  console.log(`[DrawService] Created ${winners.length} winner records in batch`);
}

/**
 * Update user stats for winners (parallel execution for efficiency)
 */
async function updateWinnerStats(raffleId: string, winners: SelectedWinner[]): Promise<void> {
  // Get unique winners (same user might win multiple times)
  const uniqueWinners = new Map<string, number>();
  for (const winner of winners) {
    const currentPrize = uniqueWinners.get(winner.walletAddress) || 0;
    uniqueWinners.set(winner.walletAddress, currentPrize + winner.prize);
  }

  // Update stats for all unique winners in parallel
  const userUpdatePromises = Array.from(uniqueWinners.entries()).map(
    ([walletAddress, totalWon]) => userRepo.recordWin(walletAddress, raffleId, totalWon)
  );

  // Update platform stats in parallel with user updates
  const totalPrize = winners.reduce((sum, w) => sum + w.prize, 0);
  const platformUpdatePromise = statsRepo.recordPayout(totalPrize, winners.length);

  await Promise.all([...userUpdatePromises, platformUpdatePromise]);

  console.log(`[DrawService] Updated stats for ${uniqueWinners.size} unique winners`);
}

/**
 * Get winners for a completed raffle
 *
 * Returns winners that were selected during the draw
 */
export async function getDrawResults(
  raffleId: string
): Promise<WinnerSelectionResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get winners
  const winnersResult = await winnerRepo.getByRaffle(raffleId);

  return {
    raffleId,
    winners: winnersResult.items,
    randomSeed: raffle.randomSeed || '',
    timestamp: Date.now(),
  };
}

/**
 * Check if raffle is ready to be drawn
 */
export async function isRaffleReadyForDraw(raffleId: string): Promise<{
  ready: boolean;
  reason?: string;
}> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    return { ready: false, reason: 'Raffle not found' };
  }

  if (raffle.status === RaffleStatus.COMPLETED) {
    return { ready: false, reason: 'Raffle already drawn' };
  }

  if (raffle.status === RaffleStatus.CANCELLED) {
    return { ready: false, reason: 'Raffle cancelled' };
  }

  const now = new Date().getTime();
  const endTime = new Date(raffle.endTime).getTime();

  if (now < endTime) {
    return { ready: false, reason: 'Raffle has not ended yet' };
  }

  const entriesResult = await entryRepo.getByRaffle(raffleId);
  if (entriesResult.items.length === 0) {
    return { ready: false, reason: 'No entries in raffle' };
  }

  return { ready: true };
}
