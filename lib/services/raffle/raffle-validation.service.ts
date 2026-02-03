/**
 * Raffle Validation Service
 *
 * Raffle-specific business rule validations.
 * Handles validation for:
 * - Raffle configuration
 * - Raffle state transitions
 * - Prize tier configuration
 * - Entry eligibility
 */

import type { RaffleItem } from '@/lib/db/models';
import { RaffleStatus } from '@/lib/db/models';
import { raffle as raffleConstants } from '@/lib/constants';
import type { CreateRaffleParams, UpdateRaffleParams } from './types';
import {
  InvalidRaffleConfigError,
  InvalidStatusTransitionError,
  RaffleNotActiveError,
  RaffleNotDrawableError,
  ValidationError,
} from '../errors';
import {
  validateNonEmptyString,
  validateStringLength,
  validateTimeRange,
  validateNumberInRange,
  validatePositiveNumber,
} from '../shared/validation.service';

// ============================================================================
// Raffle State Validation
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
 * Check if raffle is in valid status for operation
 *
 * @throws InvalidStatusTransitionError if status is not allowed
 */
export function validateRaffleStatus(
  raffle: RaffleItem,
  allowedStatuses: RaffleStatus[]
): void {
  if (!allowedStatuses.includes(raffle.status)) {
    throw new InvalidStatusTransitionError(
      raffle.status,
      `one of: ${allowedStatuses.join(', ')}`
    );
  }
}

// ============================================================================
// Status Transition Validation
// ============================================================================

/**
 * Validate status transition is allowed
 *
 * Valid transitions:
 * - scheduled -> active (when start time reached or manually activated)
 * - active <-> paused (admin can pause/resume)
 * - paused -> active (resume - reuses activate endpoint)
 * - paused -> ending (when resumed close to endTime)
 * - active -> ending (when close to end time)
 * - ending -> drawing (when draw triggered)
 * - drawing -> completed (when winners selected)
 * - scheduled/active/paused/ending -> cancelled (admin cancels)
 *
 * @throws InvalidStatusTransitionError if transition is not allowed
 */
export function validateStatusTransition(
  currentStatus: RaffleStatus,
  newStatus: RaffleStatus
): void {
  const validTransitions: Record<RaffleStatus, RaffleStatus[]> = {
    [RaffleStatus.SCHEDULED]: [RaffleStatus.ACTIVE, RaffleStatus.CANCELLED],
    [RaffleStatus.ACTIVE]: [RaffleStatus.PAUSED, RaffleStatus.ENDING, RaffleStatus.CANCELLED],
    [RaffleStatus.PAUSED]: [RaffleStatus.ACTIVE, RaffleStatus.ENDING, RaffleStatus.CANCELLED],
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

// ============================================================================
// Prize Tier Validation
// ============================================================================

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

// ============================================================================
// Raffle Configuration Validation
// ============================================================================

/**
 * Validate raffle type
 *
 * @throws InvalidRaffleConfigError if type is invalid
 */
export function validateRaffleType(type: string): void {
  if (!(raffleConstants.TYPES as readonly string[]).includes(type)) {
    throw new InvalidRaffleConfigError(
      'type',
      `Must be one of: ${raffleConstants.TYPES.join(', ')}`
    );
  }
}

/**
 * Validate raffle title
 *
 * @throws InvalidRaffleConfigError if title is invalid
 */
export function validateRaffleTitle(title: string): void {
  try {
    validateNonEmptyString(title, 'title');
    validateStringLength(title, 'title', undefined, 200);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new InvalidRaffleConfigError('title', error.message);
    }
    throw error;
  }
}

/**
 * Validate raffle entry price
 *
 * @throws InvalidRaffleConfigError if entry price is invalid
 */
export function validateEntryPrice(entryPrice: number): void {
  try {
    validateNumberInRange(
      entryPrice,
      'entryPrice',
      raffleConstants.LIMITS.MIN_ENTRY_PRICE,
      raffleConstants.LIMITS.MAX_ENTRY_PRICE
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new InvalidRaffleConfigError('entryPrice', error.message);
    }
    throw error;
  }
}

/**
 * Validate raffle winner count
 *
 * @throws InvalidRaffleConfigError if winner count is invalid
 */
export function validateWinnerCount(winnerCount: number): void {
  try {
    validateNumberInRange(
      winnerCount,
      'winnerCount',
      raffleConstants.LIMITS.MIN_WINNER_COUNT,
      raffleConstants.LIMITS.MAX_WINNER_COUNT
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new InvalidRaffleConfigError('winnerCount', error.message);
    }
    throw error;
  }
}

/**
 * Validate platform fee percentage
 *
 * @throws InvalidRaffleConfigError if platform fee is invalid
 */
export function validatePlatformFeePercent(platformFeePercent: number): void {
  if (platformFeePercent < 0) {
    throw new InvalidRaffleConfigError('platformFeePercent', 'Cannot be negative');
  }

  if (platformFeePercent > raffleConstants.LIMITS.MAX_PLATFORM_FEE_PERCENT) {
    throw new InvalidRaffleConfigError(
      'platformFeePercent',
      `Cannot exceed ${raffleConstants.LIMITS.MAX_PLATFORM_FEE_PERCENT}%`
    );
  }
}

/**
 * Validate raffle duration
 *
 * @throws InvalidRaffleConfigError if duration is too short
 */
export function validateRaffleDuration(startTime: number, endTime: number): void {
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  if (durationHours < 1) {
    throw new InvalidRaffleConfigError('duration', 'Raffle must run for at least 1 hour');
  }
}

/**
 * Validate complete raffle configuration on creation
 *
 * @throws InvalidRaffleConfigError if config is invalid
 */
export function validateRaffleConfig(config: CreateRaffleParams): void {
  // Validate type
  validateRaffleType(config.type);

  // Validate title
  validateRaffleTitle(config.title);

  // Validate entry price
  validateEntryPrice(config.entryPrice);

  // Validate time boundaries
  validateTimeRange(config.startTime, config.endTime);

  // Validate minimum duration (at least 1 hour)
  validateRaffleDuration(config.startTime, config.endTime);

  // Validate winner count if provided
  if (config.winnerCount !== undefined) {
    validateWinnerCount(config.winnerCount);
  }

  // Validate platform fee if provided
  if (config.platformFeePercent !== undefined) {
    validatePlatformFeePercent(config.platformFeePercent);
  }

  // Validate prize tiers if provided
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
    validateRaffleTitle(updates.title);
  }

  // Validate entry price if provided
  if (updates.entryPrice !== undefined) {
    validateEntryPrice(updates.entryPrice);

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

    validateTimeRange(newStartTime, newEndTime);

    // Cannot change start time if raffle already started
    const raffleStartTime = new Date(raffle.startTime).getTime();
    if (updates.startTime !== undefined && Date.now() >= raffleStartTime) {
      throw new ValidationError('startTime', 'Cannot change start time after raffle has started');
    }
  }

  // Validate winner count if provided
  if (updates.winnerCount !== undefined) {
    validateWinnerCount(updates.winnerCount);
  }

  // Validate status transition if status is being updated
  if (updates.status && updates.status !== raffle.status) {
    validateStatusTransition(raffle.status, updates.status);
  }
}
