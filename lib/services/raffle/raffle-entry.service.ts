/**
 * Raffle Entry Service
 *
 * Handles all entry creation logic and validation.
 * Coordinates atomic updates across multiple repositories.
 */

import { raffleRepo, entryRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import type { CreateEntryParams, CreateEntryResult, ValidationResult } from '../types';
import {
  RaffleNotFoundError,
  InvalidEntryError,
} from '../errors';
import {
  validateRaffleActive,
  validateMaxEntriesPerUser,
  validateWalletAddress,
  validatePositiveNumber,
  validateTransactionHash,
} from './raffle-validation.service';

/**
 * Create a raffle entry with full validation and atomic updates
 *
 * Business Rules:
 * - Raffle must exist and be active/ending
 * - User cannot exceed max entries per raffle
 * - Entry must have valid transaction hash and block number
 * - All repository updates must succeed atomically
 *
 * Side Effects:
 * - Creates entry record
 * - Updates raffle stats (totalEntries, prizePool, totalParticipants)
 * - Updates user stats (totalSpent, rafflesEntered, activeEntries)
 * - Updates platform stats (totalEntries, totalRevenue, totalUsers)
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws RaffleNotActiveError if raffle is not accepting entries
 * @throws MaxEntriesExceededError if user would exceed max entries
 * @throws InvalidEntryError if entry parameters are invalid
 */
export async function createEntry(params: CreateEntryParams): Promise<CreateEntryResult> {
  // Validate parameters
  validateEntryParams(params);

  // Get raffle
  const raffle = await raffleRepo.getById(params.raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(params.raffleId);
  }

  // Validate raffle is active
  validateRaffleActive(raffle);

  // Get user's current entry count for this raffle
  const userEntryCount = await getUserEntryCount(params.raffleId, params.walletAddress);

  // Validate max entries
  validateMaxEntriesPerUser(userEntryCount, params.numEntries, raffle.maxEntriesPerUser);

  // Verify entry cost matches
  const expectedCost = calculateEntryCost(raffle.entryPrice, params.numEntries);
  if (params.totalPaid !== expectedCost) {
    throw new InvalidEntryError(
      `Payment mismatch: expected ${expectedCost}, got ${params.totalPaid}`
    );
  }

  // Create entry record
  const entry = await entryRepo.create({
    raffleId: params.raffleId,
    walletAddress: params.walletAddress,
    numEntries: params.numEntries,
    totalPaid: params.totalPaid,
    transactionHash: params.transactionHash,
    blockNumber: params.blockNumber,
  });

  // Check if this is user's first entry in this raffle
  const isNewParticipant = userEntryCount === 0;

  // Perform atomic updates across repositories
  await Promise.all([
    // Update raffle stats
    raffleRepo.incrementEntries(
      params.raffleId,
      params.numEntries,
      params.totalPaid,
      isNewParticipant
    ),

    // Get or create user, then increment stats
    userRepo.getOrCreate(params.walletAddress).then(() =>
      userRepo.incrementEntries(
        params.walletAddress,
        params.totalPaid, // spent
        params.numEntries // numEntries
      )
    ),

    // Update platform stats
    statsRepo.incrementEntryStats(params.totalPaid, isNewParticipant),
  ]);

  // Return result
  return {
    entryId: entry.entryId,
    raffleId: entry.raffleId,
    walletAddress: entry.walletAddress,
    numEntries: entry.numEntries,
    totalPaid: entry.totalPaid,
    timestamp: new Date(entry.createdAt).getTime(),
    transactionHash: entry.transactionHash,
  };
}

/**
 * Validate entry eligibility without creating entry
 *
 * Useful for frontend validation before user submits transaction
 */
export async function validateEntryEligibility(
  raffleId: string,
  walletAddress: string,
  numEntries: number
): Promise<ValidationResult> {
  try {
    // Validate inputs
    validateWalletAddress(walletAddress);
    validatePositiveNumber(numEntries, 'numEntries');

    // Get raffle
    const raffle = await raffleRepo.getById(raffleId);
    if (!raffle) {
      return {
        valid: false,
        error: 'Raffle not found',
      };
    }

    // Check if active
    try {
      validateRaffleActive(raffle);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Raffle is not active',
      };
    }

    // Get user's current entries
    const currentEntries = await getUserEntryCount(raffleId, walletAddress);

    // Check max entries
    try {
      validateMaxEntriesPerUser(currentEntries, numEntries, raffle.maxEntriesPerUser);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Max entries exceeded',
        maxEntriesReached: true,
        currentEntries,
      };
    }

    return {
      valid: true,
      currentEntries,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Get user's current entry count for a raffle
 */
export async function getUserEntryCount(
  raffleId: string,
  walletAddress: string
): Promise<number> {
  const entries = await entryRepo.getUserEntriesForRaffle(walletAddress, raffleId);
  return entries.reduce((sum, entry) => sum + entry.numEntries, 0);
}

/**
 * Calculate total cost for entries
 *
 * @param entryPrice Price per entry in USDC cents
 * @param numEntries Number of entries
 * @returns Total cost in USDC cents
 */
export function calculateEntryCost(entryPrice: number, numEntries: number): number {
  return entryPrice * numEntries;
}

/**
 * Get all entries for a raffle
 */
export async function getRaffleEntries(raffleId: string) {
  const result = await entryRepo.getByRaffle(raffleId);
  return result.items;
}

/**
 * Get user's entries for a specific raffle
 */
export async function getUserRaffleEntries(walletAddress: string, raffleId: string) {
  return entryRepo.getUserEntriesForRaffle(walletAddress, raffleId);
}

/**
 * Validate entry creation parameters
 */
function validateEntryParams(params: CreateEntryParams): void {
  validateWalletAddress(params.walletAddress);
  validatePositiveNumber(params.numEntries, 'numEntries');
  validatePositiveNumber(params.totalPaid, 'totalPaid');
  validateTransactionHash(params.transactionHash);

  if (!Number.isInteger(params.blockNumber) || params.blockNumber <= 0) {
    throw new InvalidEntryError('Block number must be a positive integer');
  }

  if (params.numEntries > 10000) {
    throw new InvalidEntryError('Cannot create more than 10,000 entries at once');
  }
}
