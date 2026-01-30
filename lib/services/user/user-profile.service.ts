/**
 * User Profile Service
 *
 * Handles user profile management and retrieval.
 */

import { userRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import type { UserItem } from '@/lib/db/models';
import type { UserSummary } from '../types';
import { UserNotFoundError } from '../errors';
import { validateWalletAddress } from '../raffle/raffle-validation.service';

/**
 * Get or create user profile
 *
 * Creates a new user record if one doesn't exist for the wallet address
 */
export async function getOrCreateUser(walletAddress: string): Promise<UserItem> {
  validateWalletAddress(walletAddress);

  return userRepo.getOrCreate(walletAddress);
}

/**
 * Get user profile
 *
 * @throws UserNotFoundError if user doesn't exist
 */
export async function getUserProfile(walletAddress: string): Promise<UserItem> {
  validateWalletAddress(walletAddress);

  const user = await userRepo.getByAddress(walletAddress);

  if (!user) {
    throw new UserNotFoundError(walletAddress);
  }

  return user;
}

/**
 * Get user statistics summary
 *
 * Includes profile + calculated stats (win rate, total won, etc.)
 */
export async function getUserSummary(walletAddress: string): Promise<UserSummary> {
  validateWalletAddress(walletAddress);

  const user = await getOrCreateUser(walletAddress);

  // Get user's wins
  const winsResult = await winnerRepo.getByUser(walletAddress);
  const wins = winsResult.items;

  const totalWon = wins.reduce((sum, w) => sum + w.prize, 0);
  const winRate = user.rafflesEntered > 0 ? (wins.length / user.rafflesEntered) * 100 : 0;

  return {
    user,
    stats: {
      totalRafflesEntered: user.rafflesEntered,
      totalEntriesMade: 0, // TODO: Calculate total entries made across all raffles
      totalSpent: user.totalSpent,
      totalWon,
      winRate: Math.round(winRate * 100) / 100,
      activeEntries: user.activeEntries,
    },
  };
}
