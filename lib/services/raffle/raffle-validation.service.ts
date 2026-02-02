/**
 * Raffle Validation Service
 *
 * Centralizes all raffle business rules and validation logic.
 * Used by other services to enforce consistent validation across the platform.
 */

import type { RaffleItem as Raffle } from '@/lib/db/models';
import type { CreateRaffleParams, UpdateRaffleParams } from '../types';
import {
  RaffleNotActiveError,
  RaffleNotDrawableError,
  InvalidRaffleConfigError,
  InvalidStatusTransitionError,
  ValidationError,
} from '../errors';
import { patterns, errors, raffle } from '@/lib/constants';

// Maximum platform fee percent (10% in our Web2 model)
const MAX_PLATFORM_FEE_PERCENT = 10;

// Minimum and maximum entry prices (in USDC smallest unit - 6 decimals)
const MIN_ENTRY_PRICE = 1000000; // $1.00 USDC
const MAX_ENTRY_PRICE = 100000000000; // $100,000.00 USDC

// Minimum and maximum winner counts
const MIN_WINNER_COUNT = 1;
const MAX_WINNER_COUNT = 100;

/**
 * Validate raffle is active and accepting entries
 *
 * Business Rules:
 * - Raffle must be in 'active' status
 * - Current time must be between startTime and endTime
 *
 * @throws RaffleNotActiveError if raffle is not accepting entries
 */
export function validateRaffleActive(raffle: Raffle): void {
  if (raffle.status !== 'active') {
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
export function validateRaffleDrawable(raffle: Raffle, entryCount: number): void {
  // Check if already drawn or completed
  if (raffle.status === 'drawing' || raffle.status === 'completed') {
    throw new RaffleNotDrawableError(`Already drawn (status: ${raffle.status})`);
  }

  // Check if cancelled
  if (raffle.status === 'cancelled') {
    throw new RaffleNotDrawableError(`Raffle is cancelled`);
  }

  // Check status - must be active
  if (raffle.status !== 'active') {
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
  if (!(raffle.TYPES as readonly string[]).includes(config.type)) {
    throw new InvalidRaffleConfigError(
      'type',
      `Must be one of: ${raffle.TYPES.join(', ')}`
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
  if (config.entryPrice < MIN_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Must be at least ${MIN_ENTRY_PRICE} (1 USDC)`
    );
  }

  if (config.entryPrice > MAX_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Cannot exceed ${MAX_ENTRY_PRICE} (100,000 USDC)`
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
    if (config.winnerCount < MIN_WINNER_COUNT) {
      throw new InvalidRaffleConfigError('winnerCount', `Must be at least ${MIN_WINNER_COUNT}`);
    }

    if (config.winnerCount > MAX_WINNER_COUNT) {
      throw new InvalidRaffleConfigError(
        'winnerCount',
        `Cannot exceed ${MAX_WINNER_COUNT}`
      );
    }
  }

  // Validate platform fee
  if (config.platformFeePercent !== undefined) {
    if (config.platformFeePercent < 0) {
      throw new InvalidRaffleConfigError('platformFeePercent', 'Cannot be negative');
    }

    if (config.platformFeePercent > MAX_PLATFORM_FEE_PERCENT) {
      throw new InvalidRaffleConfigError(
        'platformFeePercent',
        `Cannot exceed ${MAX_PLATFORM_FEE_PERCENT}%`
      );
    }
  }

  // Validate prize tiers
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
  raffle: Raffle,
  updates: UpdateRaffleParams
): void {
  // Cannot update if raffle is completed or cancelled
  if (raffle.status === 'completed' || raffle.status === 'cancelled') {
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
    if (updates.entryPrice < MIN_ENTRY_PRICE || updates.entryPrice > MAX_ENTRY_PRICE) {
      throw new ValidationError(
        'entryPrice',
        `Must be between ${MIN_ENTRY_PRICE} and ${MAX_ENTRY_PRICE}`
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
    if (updates.winnerCount < MIN_WINNER_COUNT || updates.winnerCount > MAX_WINNER_COUNT) {
      throw new ValidationError(
        'winnerCount',
        `Must be between ${MIN_WINNER_COUNT} and ${MAX_WINNER_COUNT}`
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
  raffle: Raffle,
  allowedStatuses: Raffle['status'][]
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
  currentStatus: Raffle['status'],
  newStatus: Raffle['status']
): void {
  const validTransitions: Record<Raffle['status'], Raffle['status'][]> = {
    scheduled: ['active', 'cancelled'],
    active: ['ending', 'cancelled'],
    ending: ['drawing', 'cancelled'],
    drawing: ['completed', 'cancelled'],
    completed: [], // Terminal state
    cancelled: [], // Terminal state
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
