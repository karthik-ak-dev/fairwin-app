/**
 * Admin Payout Service
 *
 * Handles manual payout operations and payout management for admins.
 */

import { payoutRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { raffleRepo } from '@/lib/db/repositories';
import type { PayoutItem } from '@/lib/db/models';
import {
  processRafflePayouts,
  retryPayout,
  getPayoutStatus,
  getPendingPayouts,
  getFailedPayouts,
} from '../raffle/raffle-payout.service';

/**
 * Get all payouts with optional filtering
 */
export async function getAllPayouts(
  status?: 'pending' | 'paid' | 'failed'
): Promise<PayoutItem[]> {
  if (status) {
    const result = await payoutRepo.getByStatus(status);
    return result.items;
  }

  // Get all payouts across all statuses
  const [pendingResult, paidResult, failedResult] = await Promise.all([
    payoutRepo.getByStatus('pending'),
    payoutRepo.getByStatus('paid'),
    payoutRepo.getByStatus('failed'),
  ]);

  const pending = pendingResult.items;
  const paid = paidResult.items;
  const failed = failedResult.items;

  return [...pending, ...paid, ...failed].sort((a, b) => b.createdAt.localeCompare(b.createdAt));
}

/**
 * Process payouts for a specific raffle (admin trigger)
 */
export async function triggerRafflePayouts(
  raffleId: string,
  chainId: number = 137
) {
  return processRafflePayouts(raffleId, chainId);
}

/**
 * Retry a failed payout (admin trigger)
 */
export async function retryFailedPayout(
  payoutId: string,
  chainId: number = 137
) {
  return retryPayout(payoutId, chainId);
}

/**
 * Retry all failed payouts
 */
export async function retryAllFailedPayouts(chainId: number = 137) {
  const failedPayouts = await getFailedPayouts();

  const results = await Promise.allSettled(
    failedPayouts.map((payout) => retryPayout(payout.payoutId, chainId))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    total: failedPayouts.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get payout overview for admin dashboard
 */
export async function getPayoutOverview() {
  const [pendingResult, paidResult, failedResult] = await Promise.all([
    payoutRepo.getByStatus('pending'),
    payoutRepo.getByStatus('paid'),
    payoutRepo.getByStatus('failed'),
  ]);

  const pending = pendingResult.items;
  const paid = paidResult.items;
  const failed = failedResult.items;

  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = failed.reduce((sum, p) => sum + p.amount, 0);

  return {
    counts: {
      pending: pending.length,
      paid: paid.length,
      failed: failed.length,
      total: pending.length + paid.length + failed.length,
    },
    amounts: {
      pending: totalPending,
      paid: totalPaid,
      failed: totalFailed,
      total: totalPending + totalPaid + totalFailed,
    },
    pendingPayouts: pending,
    failedPayouts: failed,
  };
}

/**
 * Get raffles with pending payouts
 */
export async function getRafflesWithPendingPayouts() {
  const pendingPayouts = await getPendingPayouts();

  // Get unique raffle IDs from winners
  const winnerIdSet = new Set(pendingPayouts.map((p) => p.winnerId));
  const winnerIds = Array.from(winnerIdSet);
  const winners = await Promise.all(
    winnerIds.map((id) => winnerRepo.getById(id))
  );

  const raffleIdSet = new Set(winners.filter((w) => w !== null).map((w) => w!.raffleId));
  const raffleIds = Array.from(raffleIdSet);

  const raffles = await Promise.all(
    raffleIds.map((id) => raffleRepo.getById(id))
  );

  return raffles.filter((r) => r !== null);
}

/**
 * Get payout details by ID
 */
export async function getPayoutById(payoutId: string): Promise<PayoutItem | null> {
  return payoutRepo.getById(payoutId);
}

/**
 * Get payout status for raffle (admin view)
 */
export async function getRafflePayoutStatus(raffleId: string) {
  return getPayoutStatus(raffleId);
}

/**
 * Cancel pending payout (admin only)
 *
 * Marks a pending payout as failed without attempting transaction
 */
export async function cancelPendingPayout(
  payoutId: string,
  reason: string
): Promise<void> {
  const payout = await payoutRepo.getById(payoutId);

  if (!payout) {
    throw new Error(`Payout not found: ${payoutId}`);
  }

  if (payout.status !== 'pending') {
    throw new Error(`Can only cancel pending payouts (current status: ${payout.status})`);
  }

  await payoutRepo.updateStatus(payoutId, 'failed', undefined, `Cancelled by admin: ${reason}`);
}
