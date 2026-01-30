/**
 * Raffle Management Service
 *
 * Handles raffle creation, updates, and status transitions.
 */

import { raffleRepo, statsRepo } from '@/lib/db/repositories';
import type { RaffleItem } from '@/lib/db/models';
import type { CreateRaffleParams, UpdateRaffleParams } from '../types';
import { RaffleNotFoundError } from '../errors';
import {
  validateRaffleConfig,
  validateRaffleUpdate,
  validateStatusTransition,
} from './raffle-validation.service';

/**
 * Create a new raffle
 *
 * Business Rules:
 * - Validates all raffle configuration parameters
 * - Increments platform raffle count
 * - Sets initial status to 'scheduled' or 'active' based on start time
 *
 * @throws InvalidRaffleConfigError if config is invalid
 */
export async function createRaffle(params: CreateRaffleParams): Promise<RaffleItem> {
  // Validate configuration
  validateRaffleConfig(params);

  // Convert timestamps to ISO strings
  const startTime = new Date(params.startTime).toISOString();
  const endTime = new Date(params.endTime).toISOString();

  // Create raffle (initially scheduled)
  const raffle = await raffleRepo.create({
    type: params.type,
    title: params.title,
    description: params.description || '',
    entryPrice: params.entryPrice,
    maxEntriesPerUser: params.maxEntriesPerUser,
    winnerCount: params.winnerCount || 1,
    startTime,
    endTime,
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
 * Business Rules:
 * - Can only cancel raffles that haven't been drawn
 * - Updates status to 'cancelled'
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws InvalidStatusTransitionError if raffle cannot be cancelled
 */
export async function cancelRaffle(raffleId: string): Promise<RaffleItem> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Validate can cancel
  validateStatusTransition(raffle.status, 'cancelled');

  // Update status
  await raffleRepo.update(raffleId, { status: 'cancelled' });

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
