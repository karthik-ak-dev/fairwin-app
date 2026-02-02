/**
 * Shared Validation Service
 *
 * Common validation utilities used across the application.
 * Handles validation for:
 * - Wallet addresses
 * - Transaction hashes
 * - Numeric values
 * - General input validation
 */

import { patterns, errors } from '@/lib/constants';
import { ValidationError } from '../errors';

// ============================================================================
// Wallet & Transaction Validation
// ============================================================================

/**
 * Validate Ethereum wallet address format
 *
 * @throws ValidationError if address is invalid
 */
export function validateWalletAddress(address: string): void {
  if (!patterns.WALLET_ADDRESS.test(address)) {
    throw new ValidationError('walletAddress', errors.auth.INVALID_ADDRESS);
  }
}

/**
 * Validate Ethereum transaction hash format
 *
 * @throws ValidationError if hash is invalid
 */
export function validateTransactionHash(hash: string): void {
  if (!patterns.TRANSACTION_HASH.test(hash)) {
    throw new ValidationError('transactionHash', errors.auth.INVALID_TX_HASH);
  }
}

// ============================================================================
// Numeric Validation
// ============================================================================

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
 * Validate non-negative number
 *
 * @throws ValidationError if not a non-negative finite number
 */
export function validateNonNegativeNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError(fieldName, 'Must be a non-negative number');
  }
}

/**
 * Validate number is within range (inclusive)
 *
 * @throws ValidationError if number is outside range
 */
export function validateNumberInRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): void {
  if (!Number.isFinite(value)) {
    throw new ValidationError(fieldName, 'Must be a finite number');
  }

  if (value < min || value > max) {
    throw new ValidationError(
      fieldName,
      `Must be between ${min} and ${max}`
    );
  }
}

/**
 * Validate integer value
 *
 * @throws ValidationError if not an integer
 */
export function validateInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value)) {
    throw new ValidationError(fieldName, 'Must be an integer');
  }
}

// ============================================================================
// String Validation
// ============================================================================

/**
 * Validate string is not empty
 *
 * @throws ValidationError if string is empty or whitespace only
 */
export function validateNonEmptyString(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(fieldName, 'Cannot be empty');
  }
}

/**
 * Validate string length
 *
 * @throws ValidationError if string length is outside range
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): void {
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      fieldName,
      `Must be at least ${minLength} characters`
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      fieldName,
      `Cannot exceed ${maxLength} characters`
    );
  }
}

// ============================================================================
// Timestamp Validation
// ============================================================================

/**
 * Validate timestamp is a valid finite number
 *
 * @throws ValidationError if timestamp is invalid
 */
export function validateTimestamp(timestamp: number, fieldName: string): void {
  if (timestamp <= 0 || !Number.isFinite(timestamp)) {
    throw new ValidationError(fieldName, 'Invalid timestamp');
  }
}

/**
 * Validate time range (end must be after start)
 *
 * @throws ValidationError if range is invalid
 */
export function validateTimeRange(
  startTime: number,
  endTime: number,
  startFieldName: string = 'startTime',
  endFieldName: string = 'endTime'
): void {
  validateTimestamp(startTime, startFieldName);
  validateTimestamp(endTime, endFieldName);

  if (endTime <= startTime) {
    throw new ValidationError(endFieldName, 'Must be after start time');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validate required field is present
 *
 * @throws ValidationError if field is missing
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): asserts value is T {
  if (!isDefined(value)) {
    throw new ValidationError(fieldName, 'This field is required');
  }
}
