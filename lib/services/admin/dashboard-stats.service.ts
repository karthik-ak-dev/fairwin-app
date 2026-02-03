/**
 * Admin Dashboard Stats Service
 *
 * Calculates dashboard statistics on-demand from existing tables.
 * No caching - stats are always real-time and accurate.
 *
 * Provides:
 * - Total Value Locked (sum of active raffle prize pools)
 * - Active raffles count
 * - Ending soon count (raffles with < 5min remaining)
 * - Entries created today
 * - Revenue this week (protocol fees from last 7 days)
 */

import { raffleRepo, entryRepo } from '@/lib/db/repositories';
import { RaffleStatus } from '@/lib/db/models';
import type { DashboardStats } from './types';
import { computeDisplayStatus } from '../raffle/raffle-query.service';

/**
 * Get dashboard statistics for admin panel
 *
 * @returns Dashboard statistics calculated from database
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Get active raffles
  const activeRafflesResult = await raffleRepo.getByStatus(RaffleStatus.ACTIVE, 1000);
  const activeRaffles = activeRafflesResult.items;

  // Calculate total value locked (sum of all active raffle prize pools)
  const totalValueLocked = activeRaffles.reduce((sum, raffle) => sum + raffle.prizePool, 0);

  // Count active raffles
  const activeRafflesCount = activeRaffles.length;

  // Count raffles ending soon (using computed display status)
  const endingSoonCount = activeRaffles.filter(
    (raffle) => computeDisplayStatus(raffle) ===  RaffleStatus.ENDING
  ).length;

  // Get entries created today
  const entriesToday = await calculateEntriesToday();

  // Get revenue from last 7 days
  const revenueThisWeek = await calculateRevenueThisWeek();

  return {
    totalValueLocked,
    activeRafflesCount,
    endingSoonCount,
    entriesToday,
    revenueThisWeek,
  };
}

/**
 * Calculate number of entries created today
 *
 * Uses entry repository to get entries created since today midnight (UTC)
 */
async function calculateEntriesToday(): Promise<number> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const entries = await entryRepo.getEntriesSince(todayStart);
  return entries.length;
}

/**
 * Calculate revenue from last 7 days
 *
 * Queries completed raffles and sums protocol fees
 * from raffles that ended in the last 7 days
 */
async function calculateRevenueThisWeek(): Promise<number> {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgoISO = new Date(sevenDaysAgo).toISOString();

  // Get completed raffles
  const completedRafflesResult = await raffleRepo.getByStatus(RaffleStatus.COMPLETED, 10000);
  const completedRaffles = completedRafflesResult.items;

  // Filter raffles completed in last 7 days and sum protocol fees
  const revenueThisWeek = completedRaffles
    .filter((raffle) => raffle.endTime >= sevenDaysAgoISO)
    .reduce((sum, raffle) => sum + raffle.protocolFee, 0);

  return revenueThisWeek;
}
