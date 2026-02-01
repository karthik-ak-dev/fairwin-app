/**
 * Raffle Entry Service - Refactored with Shared Business Logic
 *
 * Handles all entry creation logic and validation.
 * Uses shared business logic to avoid duplication with event sync.
 *
 * Architecture:
 * - Platform API calls createEntry() → verifies transaction → processEntry()
 * - Event Sync calls processEntry() directly
 * - processEntry() is the single source of truth for entry creation logic
 */

import { raffleRepo, entryRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import type { CreateEntryParams, CreateEntryResult, ValidationResult } from '../types';
import type { EntryItem } from '@/lib/db/models';
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
import { verifyEntryTransaction } from './raffle-transaction-verification.service';

/**
 * SHARED BUSINESS LOGIC: Process entry creation
 *
 * This is the single source of truth for entry processing logic.
 * Used by both:
 * - Platform API (after transaction verification)
 * - Event sync (from blockchain events)
 *
 * @param params Entry parameters
 * @returns Created entry
 */
export async function processEntry(params: {
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  transactionHash: string;
  blockNumber: number;
  source: 'PLATFORM' | 'DIRECT_CONTRACT';
}): Promise<EntryItem> {
  const { raffleId, walletAddress, numEntries, totalPaid, transactionHash, blockNumber, source } =
    params;

  // 1. Check for existing entry (deduplication)
  const existingEntry = await entryRepo.findByTransactionHash(transactionHash);

  if (existingEntry) {
    // Entry exists - update source if needed
    if (existingEntry.source === 'PLATFORM' && source === 'DIRECT_CONTRACT') {
      await entryRepo.updateSource(existingEntry.entryId, 'BOTH');
      console.log(`[EntryService] Entry ${existingEntry.entryId} updated to BOTH`);
    }
    return existingEntry;
  }

  // 2. Create new entry
  const entry = await entryRepo.create({
    raffleId,
    walletAddress: walletAddress.toLowerCase(),
    numEntries,
    totalPaid,
    transactionHash,
    blockNumber,
  });

  // Set source field
  await entryRepo.updateSource(entry.entryId, source);

  console.log(`[EntryService] Created entry ${entry.entryId} with source=${source}`);

  // 3. Update all related entities (raffle, user, platform stats)
  await updateRelatedEntitiesForEntry(raffleId, walletAddress, numEntries, totalPaid);

  return entry;
}

/**
 * Update raffle stats, user stats, and platform stats
 * Extracted to avoid duplication between platform API and event sync
 */
async function updateRelatedEntitiesForEntry(
  raffleId: string,
  walletAddress: string,
  numEntries: number,
  totalPaid: number
): Promise<void> {
  // 1. Update Raffle stats
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) throw new RaffleNotFoundError(raffleId);

  const uniqueParticipants = await entryRepo.countUniqueParticipants(raffleId);
  const newPrizePool = raffle.prizePool + totalPaid;

  await raffleRepo.update(raffleId, {
    totalEntries: raffle.totalEntries + numEntries,
    totalParticipants: uniqueParticipants,
    prizePool: newPrizePool,
    protocolFee: newPrizePool * 0.1,
    winnerPayout: newPrizePool * 0.9,
  });

  // 2. Update User stats
  const isNewUser = !(await userRepo.getByAddress(walletAddress));
  const hasEnteredThisRaffleBefore = await entryRepo.hasUserEnteredRaffle(
    walletAddress,
    raffleId
  );

  await userRepo.recordEntry(
    walletAddress,
    raffleId,
    numEntries,
    totalPaid,
    hasEnteredThisRaffleBefore
  );

  // 3. Update PlatformStats
  await statsRepo.recordEntry(totalPaid, isNewUser);
}

/**
 * Platform API: Create entry with full validation and transaction verification
 *
 * Business Rules:
 * - Raffle must exist and be active/ending
 * - User cannot exceed max entries per raffle
 * - Entry must have valid transaction hash and block number
 * - Transaction must be verified on blockchain
 * - All repository updates must succeed atomically
 *
 * Side Effects:
 * - Creates entry record with source='PLATFORM'
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

  // CRITICAL SECURITY: Verify transaction on blockchain
  // This prevents fake entries by confirming the transaction actually happened
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137', 10);
  const verification = await verifyEntryTransaction(
    params.transactionHash,
    params.walletAddress,
    params.raffleId,
    params.numEntries,
    chainId
  );

  // Use verified block number from blockchain (more trustworthy than client-provided)
  const verifiedBlockNumber = verification.blockNumber;

  // Process entry using shared business logic
  const entry = await processEntry({
    raffleId: params.raffleId,
    walletAddress: params.walletAddress,
    numEntries: params.numEntries,
    totalPaid: params.totalPaid,
    transactionHash: params.transactionHash,
    blockNumber: verifiedBlockNumber,
    source: 'PLATFORM', // Platform API always marks as PLATFORM
  });

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
