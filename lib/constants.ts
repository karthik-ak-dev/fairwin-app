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
    PLATFORM_FEE_PERCENT: 5,
    WINNER_COUNT: 100,
  } as const,

  /** Validation limits */
  LIMITS: {
    /** Maximum platform fee percent (10% in our Web2 model) */
    MAX_PLATFORM_FEE_PERCENT: 10,
    /** Minimum entry price (in USDC smallest unit - 6 decimals) */
    MIN_ENTRY_PRICE: 1000000, // $1.00 USDC
    /** Maximum entry price (in USDC smallest unit - 6 decimals) */
    MAX_ENTRY_PRICE: 100000000000, // $100,000.00 USDC
    /** Minimum winner count */
    MIN_WINNER_COUNT: 1,
    /** Maximum winner count */
    MAX_WINNER_COUNT: 100,
    /** Maximum entries per transaction */
    MAX_ENTRIES_PER_TRANSACTION: 10000,
  } as const,

  /**
   * Default tiered reward distribution
   *
   * Business Logic:
   * - Platform takes 5% fee from total pool
   * - Of remaining 95%:
   *   - Tier 1 (40%): 1 lucky winner gets 40% of distributable prize
   *   - Tier 2 (30%): Next 4 winners split 30% of distributable prize
   *   - Tier 3 (30%): Remaining winners (up to 95) split 30% of distributable prize
   *
   * Max winners capped at 100 regardless of participants
   *
   * Example: 100 USDC total pool
   * - Platform fee (5%): 5 USDC
   * - Distributable prize (95%): 95 USDC
   *   - Tier 1 winner: 38 USDC (40% of 95)
   *   - Tier 2 winners (4): 7.125 USDC each (30% of 95 / 4)
   *   - Tier 3 winners (95): 0.3 USDC each (30% of 95 / 95)
   */
  PRIZE_TIERS: [
    {
      name: 'Tier 1 - Grand Prize',
      percentage: 40, // 40% of distributable prize (after platform fee)
      winnerCount: 1,
    },
    {
      name: 'Tier 2 - Top Winners',
      percentage: 30, // 30% of distributable prize
      winnerCount: 4,
    },
    {
      name: 'Tier 3 - Lucky Winners',
      percentage: 30, // 30% of distributable prize
      winnerCount: 95, // Remaining up to max cap (100 total - 1 - 4 = 95)
    },
  ] as const,
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

export interface PrizeTier {
  name: string;
  percentage: number;
  winnerCount: number;
}
