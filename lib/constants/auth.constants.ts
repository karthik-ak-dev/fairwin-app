/**
 * Authentication & Security Constants
 *
 * Centralized configuration for authentication system.
 */

// =============================================================================
// Token Configuration
// =============================================================================

/**
 * JWT token expiration time
 * Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
 */
export const JWT_EXPIRATION = '24h';

/**
 * JWT token expiration in seconds (for client-side use)
 */
export const JWT_EXPIRATION_SECONDS = 24 * 60 * 60; // 24 hours

// =============================================================================
// Challenge Configuration
// =============================================================================

/**
 * Challenge expiration time in milliseconds
 * Challenges must be used within this timeframe
 */
export const CHALLENGE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Challenge expiration time in seconds (for API responses)
 */
export const CHALLENGE_EXPIRATION_SECONDS = 300; // 5 minutes

// =============================================================================
// Validation Patterns
// =============================================================================

/**
 * Ethereum wallet address pattern
 * Format: 0x followed by 40 hexadecimal characters
 */
export const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Ethereum transaction hash pattern
 * Format: 0x followed by 64 hexadecimal characters
 */
export const TRANSACTION_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate Ethereum wallet address format
 *
 * @param address Wallet address to validate
 * @returns True if valid format, false otherwise
 */
export function isValidWalletAddress(address: string): boolean {
  return WALLET_ADDRESS_REGEX.test(address);
}

/**
 * Validate Ethereum transaction hash format
 *
 * @param hash Transaction hash to validate
 * @returns True if valid format, false otherwise
 */
export function isValidTransactionHash(hash: string): boolean {
  return TRANSACTION_HASH_REGEX.test(hash);
}

// =============================================================================
// Error Messages
// =============================================================================

export const AUTH_ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid wallet address format',
  INVALID_TX_HASH: 'Invalid transaction hash format',
  MISSING_TOKEN: 'Missing authentication token',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_SIGNATURE: 'Invalid signature',
  EXPIRED_CHALLENGE: 'Challenge expired',
  UNAUTHORIZED: 'Unauthorized',
  ADMIN_REQUIRED: 'Admin privileges required',
} as const;
