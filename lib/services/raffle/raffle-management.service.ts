/**
 * Raffle Management Service
 *
 * Handles raffle creation, updates, and status transitions.
 * DATABASE-ONLY: No blockchain interactions for MVP.
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
 * DATABASE-ONLY APPROACH:
 * Creates raffle directly in database (no blockchain interaction).
 *
 * Business Rules:
 * - Validates all raffle configuration parameters
 * - Creates raffle in database only
 * - Increments platform raffle count
 * - Sets initial status to 'scheduled' or 'active' based on start time
 *
 * @param params Raffle creation parameters
 * @throws InvalidRaffleConfigError if config is invalid
 */
export async function createRaffle(
  params: CreateRaffleParams
): Promise<RaffleItem> {
  // Validate configuration
  validateRaffleConfig(params);

  // Convert timestamps to ISO strings
  const startTime = new Date(params.startTime).toISOString();
  const endTime = new Date(params.endTime).toISOString();

  // Determine initial status based on start time
  const now = Date.now();
  const initialStatus = now >= params.startTime ? 'active' : 'scheduled';

  // Create raffle in database only
  const raffle = await raffleRepo.create({
    type: params.type,
    title: params.title,
    description: params.description || '',
    entryPrice: params.entryPrice,
    maxEntriesPerUser: params.maxEntriesPerUser,
    winnerCount: params.winnerCount || 1,
    startTime,
    endTime,
    status: initialStatus,
  });

  // Update platform stats
  await statsRepo.incrementRaffleCount();

  // Return created raffle
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
  validateStatusTransition(raffle.status, 'cancelled');

  // Update database status to 'cancelled'
  await raffleRepo.update(raffleId, {
    status: 'cancelled',
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
