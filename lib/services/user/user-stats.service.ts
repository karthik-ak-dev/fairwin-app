/**
 * User Stats Service
 *
 * Handles user statistics and analytics.
 */

import { userRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { raffleRepo } from '@/lib/db/repositories';
import type { ParticipationStats } from '../types';
import { validateWalletAddress } from '../raffle/raffle-validation.service';

/**
 * Get user's win rate
 *
 * Calculated as (number of wins / number of raffles entered) * 100
 */
export async function getUserWinRate(walletAddress: string): Promise<number> {
  validateWalletAddress(walletAddress);

  const user = await userRepo.getByAddress(walletAddress);

  if (!user || user.rafflesEntered === 0) {
    return 0;
  }

  // Get user's wins
  const winsResult = await winnerRepo.getByUser(walletAddress);
  const totalWins = winsResult.items.length;

  return totalWins > 0 ? (totalWins / user.rafflesEntered) * 100 : 0;
}

/**
 * Get participation stats for a user
 */
export async function getParticipationStats(walletAddress: string): Promise<ParticipationStats> {
  validateWalletAddress(walletAddress);

  const user = await userRepo.getByAddress(walletAddress);

  if (!user) {
    return {
      totalRaffles: 0,
      totalEntries: 0,
      totalSpent: 0,
      activeRaffles: 0,
      completedRaffles: 0,
      winCount: 0,
      winRate: 0,
    };
  }

  // Get user's wins
  const winsResult = await winnerRepo.getByUser(walletAddress);
  const wins = winsResult.items;

  const winRate = user.rafflesEntered > 0 ? (wins.length / user.rafflesEntered) * 100 : 0;

  // TODO: Calculate active and completed raffles separately
  return {
    totalRaffles: user.rafflesEntered,
    totalEntries: user.activeEntries,
    totalSpent: user.totalSpent,
    activeRaffles: user.activeEntries, // TODO: Get actual count of active raffles
    completedRaffles: user.rafflesEntered - user.activeEntries, // Approximation
    winCount: wins.length,
    winRate: Math.round(winRate * 100) / 100,
  };
}

