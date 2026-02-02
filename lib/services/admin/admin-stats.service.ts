/**
 * Admin Stats Service
 *
 * Handles platform-wide statistics and analytics for admin dashboard.
 */

import { statsRepo } from '@/lib/db/repositories';
import { raffleRepo } from '@/lib/db/repositories';
import { payoutRepo } from '@/lib/db/repositories';
import { PayoutStatus } from '@/lib/db/models';
import type { PlatformStats, TypeStats } from '../types';
import { raffle } from '@/lib/constants';

/**
 * Get comprehensive platform statistics
 *
 * Includes:
 * - Total revenue, payouts, raffles, entries, users, winners
 * - Active raffles count
 * - Average pool size
 * - Payout breakdown (pending/paid/failed)
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  // Get base stats from repository
  const stats = await statsRepo.get();

  if (!stats) {
    // Return empty stats if none exist yet
    return {
      totalRevenue: 0,
      totalPaidOut: 0,
      totalRaffles: 0,
      totalEntries: 0,
      totalUsers: 0,
      totalWinners: 0,
      activeRaffles: 0,
      avgPoolSize: 0,
      payoutStats: {
        pending: 0,
        paid: 0,
        failed: 0,
        avgAmount: 0,
      },
    };
  }

  // Get active raffles count
  const activeRaffles = await getActiveRafflesCount();

  // Get payout breakdown
  const payoutStats = await getPayoutBreakdown();

  // Calculate average pool size
  const avgPoolSize =
    stats.totalRaffles > 0 ? Math.round(stats.totalRevenue / stats.totalRaffles) : 0;

  return {
    totalRevenue: stats.totalRevenue,
    totalPaidOut: stats.totalPaidOut,
    totalRaffles: stats.totalRaffles,
    totalEntries: stats.totalEntries,
    totalUsers: stats.totalUsers,
    totalWinners: stats.totalWinners,
    activeRaffles,
    avgPoolSize,
    payoutStats,
  };
}

/**
 * Get raffle type breakdown
 *
 * Returns stats grouped by raffle type (daily, weekly, mega, flash, monthly)
 */
export async function getRaffleTypeStats(): Promise<TypeStats[]> {
  const types = raffle.TYPES;

  const statsPromises = types.map(async (type) => {
    const rafflesResult = await raffleRepo.getByType(type);
    const raffles = rafflesResult.items;

    const count = raffles.length;
    const totalRevenue = raffles.reduce((sum, r) => sum + r.prizePool, 0);
    const avgPoolSize = count > 0 ? Math.round(totalRevenue / count) : 0;

    return {
      type,
      count,
      totalRevenue,
      avgPoolSize,
    };
  });

  return Promise.all(statsPromises);
}

/**
 * Get active raffles count
 */
async function getActiveRafflesCount(): Promise<number> {
  const result = await raffleRepo.getByStatus('active');
  return result.items.length;
}

/**
 * Get payout breakdown
 */
async function getPayoutBreakdown() {
  const [pendingResult, paidResult, failedResult] = await Promise.all([
    payoutRepo.getByStatus(PayoutStatus.PENDING),
    payoutRepo.getByStatus(PayoutStatus.PAID),
    payoutRepo.getByStatus(PayoutStatus.FAILED),
  ]);

  const pending = pendingResult.items;
  const paid = paidResult.items;
  const failed = failedResult.items;

  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = failed.reduce((sum, p) => sum + p.amount, 0);

  const allPayouts = [...pending, ...paid, ...failed];
  const avgAmount = allPayouts.length > 0
    ? Math.round(allPayouts.reduce((sum, p) => sum + p.amount, 0) / allPayouts.length)
    : 0;

  return {
    pending: totalPending,
    paid: totalPaid,
    failed: totalFailed,
    avgAmount,
  };
}
