/**
 * Platform Stats Service
 *
 * Handles platform-wide statistics and analytics.
 * Provides aggregate data across all raffles, users, and payouts.
 */

import { statsRepo } from '@/lib/db/repositories';
import { RaffleStatus } from '@/lib/db/models';
import type { PlatformStats } from '../types';
import { listRaffles } from '../raffle/raffle-query.service';
import { getPlatformPayoutBreakdown } from '../raffle/raffle-payout.service';

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

  // Get active raffles count using existing raffle service
  const activeRafflesResult = await listRaffles({ status: RaffleStatus.ACTIVE, limit: 1000 });
  const activeRaffles = activeRafflesResult.raffles.length;

  // Get payout breakdown using payout service
  const payoutStats = await getPlatformPayoutBreakdown();

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
