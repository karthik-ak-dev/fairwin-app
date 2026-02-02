/**
 * Raffle Entry Service - Direct USDC Payments
 *
 * Handles entry creation with USDC transfer verification.
 *
 * Flow:
 * 1. User sends USDC to platform wallet
 * 2. Frontend calls API with transaction hash
 * 3. Backend verifies USDC transfer
 * 4. Entry created in database
 * 5. Stats updated
 *
 * Architecture:
 * - Single source of truth: Database
 * - Verification: USDC transfer verification service
 * - No event listeners needed
 */

import { raffleRepo, entryRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import type { RaffleItem } from '@/lib/db/models';
import type { CreateEntryParams, CreateEntryResult, ValidationResult } from '../types';
import {
  RaffleNotFoundError,
  InvalidEntryError,
} from '../errors';
import {
  validateRaffleActive,
  validateWalletAddress,
  validatePositiveNumber,
  validateTransactionHash,
} from './raffle-management.service';
import { verifyUSDCTransfer, isTransactionUsed } from '@/lib/blockchain/usdc-verification.service';
import { env } from '@/lib/env';
import { raffle as raffleConstants } from '@/lib/constants';

/**
 * Create raffle entry with USDC transfer verification
 *
 * Business Rules:
 * - Raffle must exist and be active/ending
 * - Transaction must be valid USDC transfer to platform wallet
 * - Transaction can only be used once (no replay attacks)
 *
 * Side Effects:
 * - Creates entry record with status='confirmed'
 * - Updates raffle stats (totalEntries, prizePool, totalParticipants)
 * - Updates user stats (totalSpent, rafflesEntered, activeEntries)
 * - Updates platform stats (totalEntries, totalRevenue, totalUsers)
 * - Creates audit log for high-value entries
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws RaffleNotActiveError if raffle is not accepting entries
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

  // Verify entry cost matches
  const expectedCost = calculateEntryCost(raffle.entryPrice, params.numEntries);
  if (params.totalPaid !== expectedCost) {
    throw new InvalidEntryError(
      `Payment mismatch: expected ${expectedCost}, got ${params.totalPaid}`
    );
  }

  // Check if transaction already used (prevent replay attacks)
  const alreadyUsed = await isTransactionUsed(params.transactionHash, entryRepo);
  if (alreadyUsed) {
    throw new InvalidEntryError('Transaction has already been used for an entry');
  }

  // CRITICAL SECURITY: Verify USDC transfer
  // This prevents fake entries by confirming the transaction actually happened
  const verification = await verifyUSDCTransfer(
    params.transactionHash,
    params.walletAddress,
    BigInt(params.totalPaid),
    env.CHAIN_ID
  );

  console.log(`[EntryService] Verified USDC transfer: ${verification.amountFormatted} from ${verification.from}`);

  // Create entry
  const entry = await entryRepo.create({
    raffleId: params.raffleId,
    walletAddress: params.walletAddress.toLowerCase(),
    numEntries: params.numEntries,
    totalPaid: params.totalPaid,
    transactionHash: params.transactionHash,
  });

  console.log(`[EntryService] Created entry ${entry.entryId}`);

  // Check if user has entered this raffle before (BEFORE creating new entry)
  const hasEnteredBefore = await entryRepo.hasUserEnteredRaffle(params.walletAddress, params.raffleId);

  // Update all related entities (raffle, user, platform stats)
  // Pass raffle to avoid re-fetching
  await updateRelatedEntitiesForEntry(raffle, params.walletAddress, params.numEntries, params.totalPaid, hasEnteredBefore);

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
 * Update raffle stats, user stats, and platform stats
 */
async function updateRelatedEntitiesForEntry(
  raffle: RaffleItem,
  walletAddress: string,
  numEntries: number,
  totalPaid: number,
  hasEnteredBefore: boolean
): Promise<void> {
  // 1. Update Raffle stats
  // Calculate new unique participants incrementally instead of fetching all entries
  const newTotalParticipants = hasEnteredBefore
    ? raffle.totalParticipants
    : raffle.totalParticipants + 1;

  const newPrizePool = raffle.prizePool + totalPaid;

  await raffleRepo.update(raffle.raffleId, {
    totalEntries: raffle.totalEntries + numEntries,
    totalParticipants: newTotalParticipants,
    prizePool: newPrizePool,
    protocolFee: newPrizePool * 0.1,
    winnerPayout: newPrizePool * 0.9,
  });

  // 2. Update User stats
  const isNewUser = !(await userRepo.getByAddress(walletAddress));

  await userRepo.recordEntry(
    walletAddress,
    raffle.raffleId,
    numEntries,
    totalPaid,
    hasEnteredBefore
  );

  // 3. Update PlatformStats
  await statsRepo.recordEntry(totalPaid, isNewUser);
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

    // Get user's current entries by fetching entries once and calculating
    const userEntries = await entryRepo.getUserEntriesForRaffle(walletAddress, raffleId);
    const currentEntries = userEntries.reduce((sum, entry) => sum + entry.numEntries, 0);

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
 * Validate entry creation parameters
 */
function validateEntryParams(params: CreateEntryParams): void {
  validateWalletAddress(params.walletAddress);
  validatePositiveNumber(params.numEntries, 'numEntries');
  validatePositiveNumber(params.totalPaid, 'totalPaid');
  validateTransactionHash(params.transactionHash);

  if (params.numEntries > raffleConstants.LIMITS.MAX_ENTRIES_PER_TRANSACTION) {
    throw new InvalidEntryError(`Cannot create more than ${raffleConstants.LIMITS.MAX_ENTRIES_PER_TRANSACTION} entries at once`);
  }
}
