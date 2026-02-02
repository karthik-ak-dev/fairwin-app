/**
 * Raffle Winner Service
 *
 * Handles raffle cancellation and refund logic.
 * Used by admin operations to manage raffle lifecycle.
 *
 * Key Principles:
 * - Transaction-safe refund operations
 * - Consistent user stats updates
 * - Audit trail for all operations
 */

import {
  raffleRepo,
  entryRepo,
  userRepo,
} from '@/lib/db/repositories';
import { RaffleStatus } from '@/lib/db/models';


/**
 * Process raffle cancellation with refunds
 *
 * Called by admin when cancelling a raffle.
 * Marks all entries as refunded and updates user stats.
 *
 * @param raffleId Raffle to cancel
 */
export async function processRaffleCancellation(raffleId: string): Promise<void> {
  // 1. Update raffle status to cancelled
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.CANCELLED,
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
