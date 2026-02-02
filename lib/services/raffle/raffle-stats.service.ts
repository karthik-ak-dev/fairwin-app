/**
 * Raffle Stats Service
 *
 * Handles raffle-specific statistics and analytics.
 * Provides stats grouped by raffle type, status, etc.
 */

import { raffleRepo } from '@/lib/db/repositories';
import type { TypeStats } from '../types';
import { raffle } from '@/lib/constants';

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
