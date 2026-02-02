/**
 * Raffle Management Service
 *
 * Handles raffle creation, updates, and status transitions.
 * DATABASE-ONLY: No blockchain interactions for MVP.
 */

import { raffleRepo, statsRepo } from '@/lib/db/repositories';
import type { RaffleItem } from '@/lib/db/models';
import { RaffleStatus } from '@/lib/db/models';
import type { CreateRaffleParams, UpdateRaffleParams } from '../types';
import { RaffleNotFoundError } from '../errors';
import {
  validateRaffleConfig,
  validateRaffleUpdate,
  validateStatusTransition,
} from './raffle-validation.service';
import { raffle as raffleConstants } from '@/lib/constants';

/**
 * Create a new raffle
 *
 * DATABASE-ONLY APPROACH:
 * Creates raffle directly in database (no blockchain interaction).
 *
 * Business Rules:
 * - Validates all raffle configuration parameters
 * - Creates raffle with tiered reward configuration
 * - Applies platform fee percentage (default 5%)
 * - Sets up prize tiers (default: 3-tier system with 40%/30%/30% split)
 * - Increments platform raffle count
 * - Sets initial status to 'scheduled'
 *
 * @param params Raffle creation parameters
 * @throws InvalidRaffleConfigError if config is invalid
 */
export async function createRaffle(
  params: CreateRaffleParams
): Promise<RaffleItem> {
  // Apply defaults for optional fields first
  const description = params.description || '';
  const platformFeePercent = params.platformFeePercent ?? raffleConstants.DEFAULTS.PLATFORM_FEE_PERCENT;
  const winnerCount = params.winnerCount ?? raffleConstants.DEFAULTS.WINNER_COUNT;
  const prizeTiers = params.prizeTiers ?? raffleConstants.PRIZE_TIERS.map(tier => ({
    name: tier.name,
    percentage: tier.percentage,
    winnerCount: tier.winnerCount,
  }));

  // Build complete config with defaults applied
  const completeConfig: CreateRaffleParams = {
    ...params,
    description,
    platformFeePercent,
    winnerCount,
    prizeTiers,
  };

  // Validate complete configuration once (validateRaffleConfig includes prize tier validation)
  validateRaffleConfig(completeConfig);

  // Convert timestamps to ISO strings
  const startTime = new Date(params.startTime).toISOString();
  const endTime = new Date(params.endTime).toISOString();

  // Create raffle in database
  // Note: status is set to 'scheduled' by default in repository
  const raffle = await raffleRepo.create({
    type: params.type,
    title: params.title,
    description,
    entryPrice: params.entryPrice,
    winnerCount,
    platformFeePercent,
    prizeTiers,
    startTime,
    endTime,
  });

  // Update platform stats
  await statsRepo.incrementRaffleCount();

  // Return created raffle (already in memory)
  return raffle;
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

  // Apply updates and return the updated raffle
  return await raffleRepo.update(raffleId, repoUpdates);
}

/**
 * Cancel a raffle
 *
 * DATABASE-ONLY APPROACH:
 * Updates raffle status to 'cancelled' in database.
 *
 * Business Rules:
 * - Can only cancel raffles that haven't been drawn
 * - Updates database status to 'cancelled'
 * - Users can claim refunds after cancellation (manual admin process)
 *
 * @param raffleId Database raffle ID
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws InvalidStatusTransitionError if raffle cannot be cancelled
 */
export async function cancelRaffle(
  raffleId: string
): Promise<RaffleItem> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Validate can cancel
  validateStatusTransition(raffle.status, RaffleStatus.CANCELLED);

  // Update database status to 'cancelled' and return
  return await raffleRepo.update(raffleId, {
    status: RaffleStatus.CANCELLED,
  });
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
  validateStatusTransition(raffle.status, RaffleStatus.ACTIVE);

  // Update status and return
  return await raffleRepo.update(raffleId, { status: RaffleStatus.ACTIVE });
}
