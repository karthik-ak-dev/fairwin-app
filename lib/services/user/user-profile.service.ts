/**
 * User Profile Service
 *
 * Handles user profile management and retrieval.
 */

import { userRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import type { UserItem } from '@/lib/db/models';
import type { UserSummary } from './types';
import { UserNotFoundError } from '../errors';
import { validateWalletAddress } from '../shared/validation.service';

/**
 * Create user on first login
 *
 * Called during authentication to ensure user record exists.
 * Idempotent - safe to call multiple times.
 *
 * @returns Created or existing user record
 */
export async function createUserOnLogin(walletAddress: string): Promise<UserItem> {
  validateWalletAddress(walletAddress);

  return userRepo.getOrCreate(walletAddress.toLowerCase());
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
 * @throws UserNotFoundError if user doesn't exist (user must be authenticated first)
 */
export async function getUserSummary(walletAddress: string): Promise<UserSummary> {
  validateWalletAddress(walletAddress);

  const user = await getUserProfile(walletAddress);

  // Get user's wins
  const winsResult = await winnerRepo.getByUser(walletAddress);
  const wins = winsResult.items;

  // Get all user's entries to calculate total entries made
  const entriesResult = await entryRepo.getByUser(walletAddress);
  const totalEntriesMade = entriesResult.items.reduce((sum, e) => sum + e.numEntries, 0);

  const totalWon = wins.reduce((sum, w) => sum + w.prize, 0);
  const winRate = user.rafflesEntered > 0 ? (wins.length / user.rafflesEntered) * 100 : 0;

  return {
    user,
    stats: {
      totalRafflesEntered: user.rafflesEntered,
      totalEntriesMade,
      totalSpent: user.totalSpent,
      totalWon,
      winRate: Math.round(winRate * 100) / 100,
      activeEntries: user.activeEntries,
    },
  };
}
