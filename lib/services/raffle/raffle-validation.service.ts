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
  MaxEntriesExceededError,
  InvalidRaffleConfigError,
  InvalidStatusTransitionError,
  ValidationError,
} from '../errors';

const RAFFLE_TYPES = ['daily', 'weekly', 'mega', 'flash', 'monthly'] as const;
const RAFFLE_STATUSES = ['scheduled', 'active', 'ending', 'drawing', 'completed', 'cancelled'] as const;

// Maximum platform fee percent (as per contract: 5%)
const MAX_PLATFORM_FEE_PERCENT = 5;

// Minimum and maximum entry prices (in USDC cents)
const MIN_ENTRY_PRICE = 100; // $1.00
const MAX_ENTRY_PRICE = 100000; // $1,000.00

// Minimum and maximum winner counts
const MIN_WINNER_COUNT = 1;
const MAX_WINNER_COUNT = 100; // As per contract

/**
 * Validate raffle is active and accepting entries
 *
 * Uses contractState as source of truth. Raffle must be in 'active' state on-chain.
 *
 * @throws RaffleNotActiveError if raffle contractState is not active
 */
export function validateRaffleActive(raffle: Raffle): void {
  // Use contractState as source of truth (blockchain state)
  const state = raffle.contractState || raffle.status;

  if (state !== 'active') {
    throw new RaffleNotActiveError(raffle.raffleId, state);
  }

  // Check time boundaries as additional validation
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
 * Uses contractState as source of truth.
 *
 * Business Rules:
 * - Raffle must be in 'active' contractState (blockchain state)
 * - Raffle end time must have passed
 * - Must have at least 1 entry
 *
 * @throws RaffleNotDrawableError if raffle cannot be drawn
 */
export function validateRaffleDrawable(raffle: Raffle, entryCount: number): void {
  // Use contractState as source of truth (blockchain state)
  const state = raffle.contractState || raffle.status;

  // Check if already drawn or completed
  if (state === 'drawing' || state === 'completed') {
    throw new RaffleNotDrawableError(`Already drawn (contractState: ${state})`);
  }

  // Check if cancelled
  if (state === 'cancelled') {
    throw new RaffleNotDrawableError(`Raffle is cancelled`);
  }

  // Check contractState - must be active
  if (state !== 'active') {
    throw new RaffleNotDrawableError(
      `Invalid contractState: ${state} (must be active)`
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
 * Validate entry count doesn't exceed max per user
 *
 * @throws MaxEntriesExceededError if limit would be exceeded
 */
export function validateMaxEntriesPerUser(
  currentEntries: number,
  newEntries: number,
  maxEntries: number
): void {
  if (currentEntries + newEntries > maxEntries) {
    throw new MaxEntriesExceededError(currentEntries, newEntries, maxEntries);
  }
}

/**
 * Validate raffle configuration on creation
 *
 * @throws InvalidRaffleConfigError if config is invalid
 */
export function validateRaffleConfig(config: CreateRaffleParams): void {
  // Validate type
  if (!RAFFLE_TYPES.includes(config.type)) {
    throw new InvalidRaffleConfigError(
      'type',
      `Must be one of: ${RAFFLE_TYPES.join(', ')}`
    );
  }

  // Validate title
  if (!config.title || config.title.trim().length === 0) {
    throw new InvalidRaffleConfigError('title', 'Cannot be empty');
  }

  if (config.title.length > 200) {
    throw new InvalidRaffleConfigError('title', 'Cannot exceed 200 characters');
  }

  // Validate entry price
  if (config.entryPrice < MIN_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Must be at least ${MIN_ENTRY_PRICE} cents ($${MIN_ENTRY_PRICE / 100})`
    );
  }

  if (config.entryPrice > MAX_ENTRY_PRICE) {
    throw new InvalidRaffleConfigError(
      'entryPrice',
      `Cannot exceed ${MAX_ENTRY_PRICE} cents ($${MAX_ENTRY_PRICE / 100})`
    );
  }

  // Validate max entries per user
  if (config.maxEntriesPerUser < 1) {
    throw new InvalidRaffleConfigError('maxEntriesPerUser', 'Must be at least 1');
  }

  if (config.maxEntriesPerUser > 10000) {
    throw new InvalidRaffleConfigError('maxEntriesPerUser', 'Cannot exceed 10,000');
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
        `Cannot exceed ${MAX_WINNER_COUNT} (contract limit)`
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
        `Cannot exceed ${MAX_PLATFORM_FEE_PERCENT}% (contract limit)`
      );
    }
  }
}

/**
 * Validate raffle update parameters
 *
 * Uses contractState as source of truth for validation.
 *
 * @throws ValidationError if update params are invalid
 */
export function validateRaffleUpdate(
  raffle: Raffle,
  updates: UpdateRaffleParams
): void {
  // Use contractState as source of truth (blockchain state)
  const state = raffle.contractState || raffle.status;

  // Cannot update if raffle is completed or cancelled on-chain
  if (state === 'completed' || state === 'cancelled') {
    throw new ValidationError(
      'contractState',
      `Cannot update raffle in ${state} contractState`
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
        `Must be between ${MIN_ENTRY_PRICE} and ${MAX_ENTRY_PRICE} cents`
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

  // Validate max entries if provided
  if (updates.maxEntriesPerUser !== undefined) {
    if (updates.maxEntriesPerUser < 1) {
      throw new ValidationError('maxEntriesPerUser', 'Must be at least 1');
    }

    // Cannot decrease below current max user entries
    // (Would need to query all entries to validate - skip for now)
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
 * NOTE: This validates display status transitions only.
 * contractState is the source of truth and is set by blockchain events.
 * Display status is computed from contractState + time logic.
 *
 * Valid transitions:
 * - scheduled -> active (when start time reached)
 * - active -> ending (when close to end time)
 * - ending -> drawing (when draw triggered)
 * - drawing -> completed (when winners selected)
 * - any -> cancelled (when cancelled on-chain)
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
  // EVM address: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;

  if (!addressRegex.test(address)) {
    throw new ValidationError('walletAddress', 'Invalid Ethereum address format');
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
  // Ethereum transaction hash: 0x followed by 64 hex characters
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;

  if (!txHashRegex.test(hash)) {
    throw new ValidationError('transactionHash', 'Invalid transaction hash format');
  }
}
