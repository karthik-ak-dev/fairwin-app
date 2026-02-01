/**
 * Application Constants - Singleton Pattern
 *
 * Centralized configuration for all application constants.
 * Similar to env.ts, this provides a single source of truth for constants.
 */

// =============================================================================
// Authentication Constants
// =============================================================================

export const auth = {
  /** JWT token expiration time (format: number + unit) */
  JWT_EXPIRATION: '24h',

  /** JWT token expiration in seconds (for client-side use) */
  JWT_EXPIRATION_SECONDS: 24 * 60 * 60, // 24 hours

  /** Challenge expiration time in milliseconds */
  CHALLENGE_EXPIRATION_MS: 5 * 60 * 1000, // 5 minutes

  /** Challenge expiration time in seconds (for API responses) */
  CHALLENGE_EXPIRATION_SECONDS: 300, // 5 minutes
} as const;

// =============================================================================
// Validation Patterns
// =============================================================================

export const patterns = {
  /** Ethereum wallet address pattern (0x + 40 hex chars) */
  WALLET_ADDRESS: /^0x[a-fA-F0-9]{40}$/,

  /** Ethereum transaction hash pattern (0x + 64 hex chars) */
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
} as const;

// =============================================================================
// Blockchain Constants
// =============================================================================

export const blockchain = {
  /** Default chain ID (Polygon Mainnet) */
  DEFAULT_CHAIN_ID: 137,

  /** Supported chain IDs */
  CHAIN_IDS: {
    POLYGON_MAINNET: 137,
    POLYGON_AMOY_TESTNET: 80002,
  } as const,

  /** Chain names for display */
  CHAIN_NAMES: {
    137: 'Polygon Mainnet',
    80002: 'Polygon Amoy Testnet',
  } as const,
} as const;

// =============================================================================
// Pagination Constants
// =============================================================================

export const pagination = {
  /** Default page size for general listings */
  DEFAULT_LIMIT: 20 as number,

  /** Default page size for user-facing lists (entries, wins, participants) */
  USER_LIST_LIMIT: 50 as number,

  /** Maximum allowed page size */
  MAX_LIMIT: 100 as number,
};

// =============================================================================
// Raffle Constants
// =============================================================================

export const raffle = {
  /** Valid raffle types */
  TYPES: ['daily', 'weekly', 'mega', 'flash', 'monthly'] as const,

  /** Raffle status values */
  STATUS: {
    SCHEDULED: 'scheduled',
    ACTIVE: 'active',
    ENDING: 'ending',
    DRAWING: 'drawing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  } as const,

  /** Default raffle configuration values */
  DEFAULTS: {
    MAX_ENTRIES_PER_USER: 50,
    PLATFORM_FEE_PERCENT: 5,
    WINNER_COUNT: 1,
  } as const,
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const errors = {
  auth: {
    INVALID_ADDRESS: 'Invalid wallet address format',
    INVALID_TX_HASH: 'Invalid transaction hash format',
    MISSING_TOKEN: 'Missing authentication token',
    INVALID_TOKEN: 'Invalid or expired token',
    INVALID_SIGNATURE: 'Invalid signature',
    EXPIRED_CHALLENGE: 'Challenge expired',
    UNAUTHORIZED: 'Unauthorized',
    ADMIN_REQUIRED: 'Admin privileges required',
  },

  raffle: {
    NOT_FOUND: 'Raffle not found',
    NOT_ACTIVE: 'Raffle is not active',
    ALREADY_ENDED: 'Raffle has already ended',
    MAX_ENTRIES_EXCEEDED: 'Maximum entries exceeded',
    INVALID_ENTRY: 'Invalid entry parameters',
  },
} as const;

// =============================================================================
// Validation Helper Functions
// =============================================================================

/**
 * Validate Ethereum wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return patterns.WALLET_ADDRESS.test(address);
}

/**
 * Validate Ethereum transaction hash format
 */
export function isValidTransactionHash(hash: string): boolean {
  return patterns.TRANSACTION_HASH.test(hash);
}

/**
 * Validate raffle type
 */
export function isValidRaffleType(type: string): type is typeof raffle.TYPES[number] {
  return (raffle.TYPES as readonly string[]).includes(type);
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(n: unknown): n is number {
  return typeof n === 'number' && n > 0 && isFinite(n);
}

// =============================================================================
// Type Exports
// =============================================================================

export type RaffleType = typeof raffle.TYPES[number];
export type RaffleStatus = typeof raffle.STATUS[keyof typeof raffle.STATUS];
