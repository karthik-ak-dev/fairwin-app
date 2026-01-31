/**
 * Raffle Winner Service - Shared Business Logic
 *
 * Handles winner selection and raffle cancellation logic.
 * Used by both event sync and admin operations to ensure consistency.
 *
 * Key Principles:
 * - Single source of truth for winner/cancellation logic
 * - No duplication with event handlers
 * - Transaction-safe operations
 */

import {
  raffleRepo,
  entryRepo,
  winnerRepo,
  payoutRepo,
  userRepo,
  statsRepo,
} from '@/lib/db/repositories';

/**
 * Process winner selection
 *
 * Called by:
 * - Event sync (when WinnersSelected event detected)
 * - Admin manual winner selection (future feature)
 *
 * @param params Winner selection parameters
 */
export async function processWinnerSelection(params: {
  raffleId: string;
  winners: string[]; // wallet addresses
  prizes: number[]; // amounts in USDC smallest unit
  totalPrize: number;
  transactionHash: string;
}): Promise<void> {
  const { raffleId, winners, prizes, totalPrize, transactionHash } = params;

  // 1. Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new Error(`Raffle ${raffleId} not found`);
  }

  // 2. Update raffle status to completed
  await raffleRepo.update(raffleId, {
    contractState: 'completed',
    status: 'completed',
  });

  // 3. Process each winner
  for (let i = 0; i < winners.length; i++) {
    const winnerAddress = winners[i].toLowerCase();
    const prizeAmount = prizes[i];

    // 3a. Create Winner record
    const winner = await winnerRepo.create({
      raffleId,
      walletAddress: winnerAddress,
      ticketNumber: i + 1, // Simplified (actual should be calculated from VRF random word)
      totalTickets: raffle.totalEntries,
      prize: prizeAmount,
      tier: getTierLabel(i, winners.length),
      transactionHash,
    });

    // 3b. Create Payout record (already paid on-chain by contract)
    await payoutRepo.create({
      winnerId: winner.winnerId,
      raffleId,
      walletAddress: winnerAddress,
      amount: prizeAmount,
      status: 'paid', // Contract already paid
      transactionHash,
      processedAt: new Date().toISOString(),
    });

    // 3c. Update User stats (increment winnings and win count)
    await userRepo.recordWin(winnerAddress, prizeAmount);
  }

  // 4. Update PlatformStats (increment payout totals)
  await statsRepo.recordPayout(totalPrize, winners.length);

  // 5. Decrement activeEntries for all participants
  await decrementActiveEntriesForRaffle(raffleId);

  console.log(
    `[WinnerService] Processed ${winners.length} winners for raffle ${raffleId}, total prize: ${totalPrize}`
  );
}

/**
 * Process raffle cancellation
 *
 * Called by:
 * - Event sync (when RaffleCancelled event detected)
 * - Admin manual cancellation (future feature)
 *
 * @param raffleId Raffle to cancel
 */
export async function processRaffleCancellation(raffleId: string): Promise<void> {
  // 1. Update raffle status
  await raffleRepo.update(raffleId, {
    contractState: 'cancelled',
    status: 'cancelled',
  });

  // 2. Get all entries
  const allEntries = await entryRepo.findByRaffleId(raffleId);

  // 3. Mark all entries as refunded
  const entryIds = allEntries.map((e) => e.entryId);
  await entryRepo.markAsRefunded(entryIds);

  // 4. Process refunds for each user
  const refundsByUser = new Map<string, { numEntries: number; totalPaid: number }>();

  for (const entry of allEntries) {
    const current = refundsByUser.get(entry.walletAddress) || {
      numEntries: 0,
      totalPaid: 0,
    };
    refundsByUser.set(entry.walletAddress, {
      numEntries: current.numEntries + entry.numEntries,
      totalPaid: current.totalPaid + entry.totalPaid,
    });
  }

  // Update user stats (decrement activeEntries, totalSpent)
  for (const [walletAddress, { numEntries, totalPaid }] of Array.from(refundsByUser.entries())) {
    await userRepo.processRefund(walletAddress, numEntries, totalPaid);
  }

  console.log(
    `[WinnerService] Cancelled raffle ${raffleId}, refunded ${allEntries.length} entries`
  );
}

/**
 * Decrement active entries for all participants in a raffle
 * Shared by winner selection and raffle cancellation
 */
async function decrementActiveEntriesForRaffle(raffleId: string): Promise<void> {
  const allEntries = await entryRepo.findByRaffleId(raffleId);

  // Group by user
  const entriesByUser = new Map<string, number>();
  for (const entry of allEntries) {
    const current = entriesByUser.get(entry.walletAddress) || 0;
    entriesByUser.set(entry.walletAddress, current + entry.numEntries);
  }

  // Update each user (decrement activeEntries)
  for (const [walletAddress, totalEntries] of Array.from(entriesByUser.entries())) {
    await userRepo.updateActiveEntries(walletAddress, -totalEntries);
  }
}

/**
 * Get tier label for winner position
 */
function getTierLabel(index: number, totalWinners: number): string {
  const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  return labels[index] || `${index + 1}th`;
}
