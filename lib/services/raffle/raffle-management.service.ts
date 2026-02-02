/**
 * Raffle Management Service
 *
 * Handles raffle creation, updates, status transitions, and validation.
 * This service combines:
 * - Raffle CRUD operations
 * - Business rule validation
 * - Status transition logic
 *
 * DATABASE-ONLY: No blockchain interactions for MVP.
 */

import { raffleRepo, statsRepo } from '@/lib/db/repositories';
import type { RaffleItem } from '@/lib/db/models';
import { RaffleStatus } from '@/lib/db/models';
import type { CreateRaffleParams, UpdateRaffleParams } from '../types';
import {
  RaffleNotFoundError,
  RaffleNotActiveError,
  RaffleNotDrawableError,
  InvalidRaffleConfigError,
  InvalidStatusTransitionError,
  ValidationError,
} from '../errors';
import { patterns, errors, raffle as raffleConstants } from '@/lib/constants';
import { processRaffleCancellation } from './raffle-payout.service';

// ============================================================================
// Validation Functions (exported for use by other services)
// ============================================================================

/**
 * Validate raffle is active and accepting entries
 *
 * Business Rules:
 * - Raffle must be in 'active' status
 * - Current time must be between startTime and endTime
 *
 * @throws RaffleNotActiveError if raffle is not accepting entries
 */
export function validateRaffleActive(raffle: RaffleItem): void {
  if (raffle.status !== RaffleStatus.ACTIVE) {
    throw new RaffleNotActiveError(raffle.raffleId, raffle.status);
  }

  // Check time boundaries
  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  if (now < startTime) {
    throw new RaffleNotActiveError(raffle.raffleId, 'not started yet');
  }

  if (now > endTime) {
    throw new RaffleNotActiveError(raffle.raffleId, 'already ended');
  }
}

/**
 * Validate raffle can be drawn
 *
 * Business Rules:
 * - Raffle must be in 'active' status
 * - Raffle end time must have passed
 * - Must have at least 1 entry
 *
 * @throws RaffleNotDrawableError if raffle cannot be drawn
 */
export function validateRaffleDrawable(raffle: RaffleItem, entryCount: number): void {
  // Check if already drawn or completed
  if (raffle.status === RaffleStatus.DRAWING || raffle.status === RaffleStatus.COMPLETED) {
    throw new RaffleNotDrawableError(`Already drawn (status: ${raffle.status})`);
  }

  // Check if cancelled
  if (raffle.status === RaffleStatus.CANCELLED) {
    throw new RaffleNotDrawableError(`Raffle is cancelled`);
  }

  // Check status - must be active
  if (raffle.status !== RaffleStatus.ACTIVE) {
    throw new RaffleNotDrawableError(
      `Invalid status: ${raffle.status} (must be active)`
    );
  }

  // Check end time
  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();
  if (now < endTime) {
    throw new RaffleNotDrawableError(
      `Raffle has not ended yet (ends at ${raffle.endTime})`
    );
  }

  // Check for entries
  if (entryCount === 0) {
    throw new RaffleNotDrawableError('No entries found');
  }
}

/**
 * Validate prize tier configuration
 *
 * Business Rules:
 * - Tier percentages must sum to 100%
 * - Tier winner counts must sum to total winnerCount
 * - Each tier must have at least 1 winner
 * - Each tier percentage must be positive
 *
 * @throws InvalidRaffleConfigError if tier config is invalid
 */
export function validatePrizeTiers(
  prizeTiers: Array<{ name: string; percentage: number; winnerCount: number }>,
  totalWinnerCount?: number
): void {
  if (!prizeTiers || prizeTiers.length === 0) {
    throw new InvalidRaffleConfigError('prizeTiers', 'Must have at least one prize tier');
  }

  // Validate each tier
  for (let i = 0; i < prizeTiers.length; i++) {
    const tier = prizeTiers[i];

    if (!tier.name || tier.name.trim().length === 0) {
      throw new InvalidRaffleConfigError(
        `prizeTiers[${i}].name`,
        'Tier name cannot be empty'
      );
    }

    if (tier.percentage <= 0) {
      throw new InvalidRaffleConfigError(
        `prizeTiers[${i}].percentage`,
        'Tier percentage must be positive'
      );
    }

    if (tier.winnerCount < 1) {
      throw new InvalidRaffleConfigError(
        `prizeTiers[${i}].winnerCount`,
        'Tier must have at least 1 winner'
      );
    }
  }

  // Validate percentages sum to 100
  const totalPercentage = prizeTiers.reduce((sum, tier) => sum + tier.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new InvalidRaffleConfigError(
      'prizeTiers',
      `Tier percentages must sum to 100% (currently ${totalPercentage}%)`
    );
  }

  // Validate winner counts sum to total if provided
  if (totalWinnerCount !== undefined) {
    const totalTierWinners = prizeTiers.reduce((sum, tier) => sum + tier.winnerCount, 0);
    if (totalTierWinners !== totalWinnerCount) {
      throw new InvalidRaffleConfigError(
        'prizeTiers',
        `Tier winner counts must sum to total winnerCount (${totalTierWinners} vs ${totalWinnerCount})`
      );
    }
  }
}

/**
 * Validate raffle configuration on creation
 *
 * @throws InvalidRaffleConfigError if config is invalid
 */
export function validateRaffleConfig(config: CreateRaffleParams): void {
  // Validate type
  if (!(raffleConstants.TYPES as readonly string[]).includes(config.type)) {
    throw new InvalidRaffleConfigError(
      'type',
      `Must be one of: ${raffleConstants.TYPES.join(', ')}`
    );
  }

  // Validate title
  if (!config.title || config.title.trim().length === 0) {
    throw new InvalidRaffleConfigError('title', 'Cannot be empty');
  }

  if (config.title.length > 200) {
    throw new InvalidRaffleConfigError('title', 'Cannot exceed 200 characters');
  }

  // Validate entry price (in USDC smallest unit)
  if (config.entryPrice < raffleConstants.LIMITS.MIN_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Must be at least ${raffleConstants.LIMITS.MIN_ENTRY_PRICE} (1 USDC)`
    );
  }

  if (config.entryPrice > raffleConstants.LIMITS.MAX_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Cannot exceed ${raffleConstants.LIMITS.MAX_ENTRY_PRICE} (100,000 USDC)`
    );
  }

  // Validate time boundaries
  if (config.startTime <= 0 || !Number.isFinite(config.startTime)) {
    throw new InvalidRaffleConfigError('startTime', 'Invalid timestamp');
  }

  if (config.endTime <= 0 || !Number.isFinite(config.endTime)) {
    throw new InvalidRaffleConfigError('endTime', 'Invalid timestamp');
  }

  if (config.endTime <= config.startTime) {
    throw new InvalidRaffleConfigError('endTime', 'Must be after start time');
  }

  // Validate minimum duration (at least 1 hour)
  const durationHours = (config.endTime - config.startTime) / (1000 * 60 * 60);
  if (durationHours < 1) {
    throw new InvalidRaffleConfigError('duration', 'Raffle must run for at least 1 hour');
  }

  // Validate winner count
  if (config.winnerCount !== undefined) {
    if (config.winnerCount < raffleConstants.LIMITS.MIN_WINNER_COUNT) {
      throw new InvalidRaffleConfigError('winnerCount', `Must be at least ${raffleConstants.LIMITS.MIN_WINNER_COUNT}`);
    }

    if (config.winnerCount > raffleConstants.LIMITS.MAX_WINNER_COUNT) {
      throw new InvalidRaffleConfigError(
        'winnerCount',
        `Cannot exceed ${raffleConstants.LIMITS.MAX_WINNER_COUNT}`
      );
    }
  }

  // Validate platform fee
  if (config.platformFeePercent !== undefined) {
    if (config.platformFeePercent < 0) {
      throw new InvalidRaffleConfigError('platformFeePercent', 'Cannot be negative');
    }

    if (config.platformFeePercent > raffleConstants.LIMITS.MAX_PLATFORM_FEE_PERCENT) {
      throw new InvalidRaffleConfigError(
        'platformFeePercent',
        `Cannot exceed ${raffleConstants.LIMITS.MAX_PLATFORM_FEE_PERCENT}%`
      );
    }
  }

  // Validate prize tiers (should be called after defaults are applied)
  if (config.prizeTiers) {
    validatePrizeTiers(config.prizeTiers, config.winnerCount);
  }
}

/**
 * Validate raffle update parameters
 *
 * @throws ValidationError if update params are invalid
 */
export function validateRaffleUpdate(
  raffle: RaffleItem,
  updates: UpdateRaffleParams
): void {
  // Cannot update if raffle is completed or cancelled
  if (raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED) {
    throw new ValidationError(
      'status',
      `Cannot update raffle in ${raffle.status} status`
    );
  }

  // Validate title if provided
  if (updates.title !== undefined) {
    if (updates.title.trim().length === 0) {
      throw new ValidationError('title', 'Cannot be empty');
    }
    if (updates.title.length > 200) {
      throw new ValidationError('title', 'Cannot exceed 200 characters');
    }
  }

  // Validate entry price if provided
  if (updates.entryPrice !== undefined) {
    if (updates.entryPrice < raffleConstants.LIMITS.MIN_ENTRY_PRICE || updates.entryPrice > raffleConstants.LIMITS.MAX_ENTRY_PRICE) {
      throw new ValidationError(
        'entryPrice',
        `Must be between ${raffleConstants.LIMITS.MIN_ENTRY_PRICE} and ${raffleConstants.LIMITS.MAX_ENTRY_PRICE}`
      );
    }

    // Cannot change entry price if entries already exist
    if (raffle.totalEntries > 0) {
      throw new ValidationError(
        'entryPrice',
        'Cannot change entry price after entries have been made'
      );
    }
  }

  // Validate time updates
  if (updates.startTime !== undefined || updates.endTime !== undefined) {
    const newStartTime = updates.startTime ?? new Date(raffle.startTime).getTime();
    const newEndTime = updates.endTime ?? new Date(raffle.endTime).getTime();

    if (newEndTime <= newStartTime) {
      throw new ValidationError('endTime', 'Must be after start time');
    }

    // Cannot change start time if raffle already started
    const raffleStartTime = new Date(raffle.startTime).getTime();
    if (updates.startTime !== undefined && Date.now() >= raffleStartTime) {
      throw new ValidationError('startTime', 'Cannot change start time after raffle has started');
    }
  }

  // Validate winner count if provided
  if (updates.winnerCount !== undefined) {
    if (updates.winnerCount < raffleConstants.LIMITS.MIN_WINNER_COUNT || updates.winnerCount > raffleConstants.LIMITS.MAX_WINNER_COUNT) {
      throw new ValidationError(
        'winnerCount',
        `Must be between ${raffleConstants.LIMITS.MIN_WINNER_COUNT} and ${raffleConstants.LIMITS.MAX_WINNER_COUNT}`
      );
    }
  }
}

/**
 * Check if raffle is in valid status for operation
 *
 * @throws InvalidStatusTransitionError if status is not allowed
 */
export function validateRaffleStatus(
  raffle: RaffleItem,
  allowedStatuses: RaffleItem['status'][]
): void {
  if (!allowedStatuses.includes(raffle.status)) {
    throw new InvalidStatusTransitionError(
      raffle.status,
      `one of: ${allowedStatuses.join(', ')}`
    );
  }
}

/**
 * Validate status transition is allowed
 *
 * Valid transitions:
 * - scheduled -> active (when start time reached)
 * - active -> ending (when close to end time)
 * - ending -> drawing (when draw triggered)
 * - drawing -> completed (when winners selected)
 * - any -> cancelled (when admin cancels)
 *
 * @throws InvalidStatusTransitionError if transition is not allowed
 */
export function validateStatusTransition(
  currentStatus: RaffleStatus,
  newStatus: RaffleStatus
): void {
  const validTransitions: Record<RaffleStatus, RaffleStatus[]> = {
    [RaffleStatus.SCHEDULED]: [RaffleStatus.ACTIVE, RaffleStatus.CANCELLED],
    [RaffleStatus.ACTIVE]: [RaffleStatus.ENDING, RaffleStatus.CANCELLED],
    [RaffleStatus.ENDING]: [RaffleStatus.DRAWING, RaffleStatus.CANCELLED],
    [RaffleStatus.DRAWING]: [RaffleStatus.COMPLETED, RaffleStatus.CANCELLED],
    [RaffleStatus.COMPLETED]: [], // Terminal state
    [RaffleStatus.CANCELLED]: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new InvalidStatusTransitionError(currentStatus, newStatus);
  }
}

/**
 * Validate wallet address format
 *
 * @throws ValidationError if address is invalid
 */
export function validateWalletAddress(address: string): void {
  if (!patterns.WALLET_ADDRESS.test(address)) {
    throw new ValidationError('walletAddress', errors.auth.INVALID_ADDRESS);
  }
}

/**
 * Validate positive number
 *
 * @throws ValidationError if not a positive finite number
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError(fieldName, 'Must be a positive number');
  }
}

/**
 * Validate transaction hash format
 *
 * @throws ValidationError if hash is invalid
 */
export function validateTransactionHash(hash: string): void {
  if (!patterns.TRANSACTION_HASH.test(hash)) {
    throw new ValidationError('transactionHash', errors.auth.INVALID_TX_HASH);
  }
}

// ============================================================================
// Raffle Management Operations
// ============================================================================

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
 * Updates raffle status to 'cancelled' in database and processes refunds.
 *
 * Business Rules:
 * - Can only cancel raffles that haven't been drawn
 * - Updates database status to 'cancelled'
 * - Processes refunds for all entries
 * - Updates user stats to reflect refunds
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

  // Update database status to 'cancelled'
  const updatedRaffle = await raffleRepo.update(raffleId, {
    status: RaffleStatus.CANCELLED,
  });

  // Process refunds for all entries
  await processRaffleCancellation(raffleId);

  return updatedRaffle;
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
