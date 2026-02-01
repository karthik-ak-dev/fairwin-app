/**
 * Raffle Management Service
 *
 * Handles raffle creation, updates, and status transitions.
 */

import { raffleRepo, statsRepo } from '@/lib/db/repositories';
import type { RaffleItem } from '@/lib/db/models';
import type { CreateRaffleParams, UpdateRaffleParams } from '../types';
import { blockchain } from '@/lib/constants';
import { RaffleNotFoundError } from '../errors';
import {
  validateRaffleConfig,
  validateRaffleUpdate,
  validateStatusTransition,
} from './raffle-validation.service';
import { getContractAddress } from '@/lib/blockchain';
import {
  createRaffleOnChain,
  cancelRaffleOnChain,
} from './raffle-blockchain.service';

/**
 * Create a new raffle
 *
 * BLOCKCHAIN-FIRST APPROACH:
 * 1. Create raffle on blockchain FIRST
 * 2. Get contractRaffleId from blockchain event
 * 3. Save to database with contractRaffleId
 *
 * This ensures database cannot contain raffles that don't exist on-chain.
 *
 * Business Rules:
 * - Validates all raffle configuration parameters
 * - Creates raffle on blockchain first
 * - Records contractRaffleId for event synchronization
 * - Increments platform raffle count
 * - Sets initial status to 'scheduled' or 'active' based on start time
 *
 * @param params Raffle creation parameters
 * @param chainId Blockchain chain ID (default: Polygon Mainnet)
 * @throws InvalidRaffleConfigError if config is invalid
 * @throws ContractWriteError if blockchain creation fails
 */
export async function createRaffle(
  params: CreateRaffleParams,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<RaffleItem> {
  // Validate configuration
  validateRaffleConfig(params);

  // Calculate duration in seconds
  const durationSeconds = Math.floor((params.endTime - params.startTime) / 1000);

  // STEP 1: Create raffle on blockchain FIRST
  const blockchainResult = await createRaffleOnChain(
    BigInt(params.entryPrice),
    BigInt(durationSeconds),
    BigInt(params.maxEntriesPerUser),
    chainId
  );

  // Get contract address for storage
  const addresses = getContractAddress(chainId);

  // Convert timestamps to ISO strings
  const startTime = new Date(params.startTime).toISOString();
  const endTime = new Date(params.endTime).toISOString();

  // STEP 2: Save to database with contractRaffleId
  const raffle = await raffleRepo.create({
    type: params.type,
    title: params.title,
    description: params.description || '',
    entryPrice: params.entryPrice,
    maxEntriesPerUser: params.maxEntriesPerUser,
    winnerCount: params.winnerCount || 1,
    startTime,
    endTime,
    contractRaffleId: blockchainResult.contractRaffleId,
    contractAddress: addresses.raffle,
    transactionHash: blockchainResult.transactionHash,
    contractState: 'active', // Raffle is active on-chain after creation
  });

  // Determine if should be immediately active based on start time
  const now = Date.now();
  if (now >= params.startTime) {
    await raffleRepo.update(raffle.raffleId, { status: 'active' });
  }

  // Update platform stats
  await statsRepo.incrementRaffleCount();

  // Return updated raffle
  const created = await raffleRepo.getById(raffle.raffleId);
  return created!;
}

/**
 * Update an existing raffle
 *
 * Business Rules:
 * - Cannot update completed or cancelled raffles
 * - Validates all update parameters
 * - Cannot change certain fields after entries exist
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws ValidationError if update params are invalid
 */
export async function updateRaffle(
  raffleId: string,
  updates: UpdateRaffleParams
): Promise<RaffleItem> {
  // Get existing raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Validate updates
  validateRaffleUpdate(raffle, updates);

  // Validate status transition if status is being updated
  if (updates.status && updates.status !== raffle.status) {
    validateStatusTransition(raffle.status, updates.status);
  }

  // Convert params to repository format
  const { startTime, endTime, ...otherUpdates } = updates;
  const repoUpdates: Partial<RaffleItem> = {
    ...otherUpdates,
    ...(startTime && { startTime: new Date(startTime).toISOString() }),
    ...(endTime && { endTime: new Date(endTime).toISOString() }),
  };

  // Apply updates
  await raffleRepo.update(raffleId, repoUpdates);

  // Return updated raffle
  const updated = await raffleRepo.getById(raffleId);
  return updated!;
}

/**
 * Cancel a raffle
 *
 * BLOCKCHAIN-FIRST APPROACH:
 * 1. Cancel raffle on blockchain FIRST
 * 2. Verify RaffleCancelled event was emitted
 * 3. Update database status to 'cancelled'
 *
 * This ensures database cannot show raffles as cancelled when they're still active on-chain.
 *
 * Business Rules:
 * - Can only cancel raffles that haven't been drawn
 * - Cancels on blockchain first, then updates database
 * - Users can claim refunds after cancellation
 *
 * @param raffleId Database raffle ID
 * @param chainId Blockchain chain ID (default: Polygon Mainnet)
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws InvalidStatusTransitionError if raffle cannot be cancelled
 * @throws ContractWriteError if blockchain cancellation fails
 */
export async function cancelRaffle(
  raffleId: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<RaffleItem> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Validate can cancel
  validateStatusTransition(raffle.status, 'cancelled');

  // Ensure raffle has contractRaffleId
  if (!raffle.contractRaffleId) {
    throw new Error(
      `Cannot cancel raffle ${raffleId}: missing contractRaffleId. ` +
      'Raffle may not have been created on blockchain yet.'
    );
  }

  // STEP 1: Cancel raffle on blockchain FIRST
  const blockchainResult = await cancelRaffleOnChain(
    raffle.contractRaffleId,
    chainId
  );

  // STEP 2: Update database status to 'cancelled'
  await raffleRepo.update(raffleId, {
    status: 'cancelled',
    contractState: 'cancelled',
    transactionHash: blockchainResult.transactionHash,
  });

  const updated = await raffleRepo.getById(raffleId);
  return updated!;
}

/**
 * Activate a scheduled raffle
 *
 * Business Rules:
 * - Can only activate scheduled raffles
 * - Updates status to 'active'
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws InvalidStatusTransitionError if raffle cannot be activated
 */
export async function activateRaffle(raffleId: string): Promise<RaffleItem> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Validate can activate
  validateStatusTransition(raffle.status, 'active');

  // Update status
  await raffleRepo.update(raffleId, { status: 'active' });

  const updated = await raffleRepo.getById(raffleId);
  return updated!;
}
