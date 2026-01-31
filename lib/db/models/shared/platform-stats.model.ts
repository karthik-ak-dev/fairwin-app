/**
 * PlatformStats Model - Shared across all games
 *
 * Represents platform-wide aggregate statistics.
 * This is a singleton model - only ONE record exists with statId='global'.
 * All stats are cumulative across ALL games on the platform.
 *
 * DynamoDB Table: FairWin-{Env}-PlatformStats
 * Primary Key: statId (HASH) - always 'global'
 *
 * Use Cases:
 * - Admin dashboard overview
 * - Marketing metrics (total revenue, users, etc.)
 * - Public statistics display
 * - Financial reporting
 *
 * Update Strategy:
 * - Use atomic ADD operations for counters
 * - Update on every significant event (entry, win, payout)
 * - Never delete this record
 */
export interface PlatformStatsItem {
  /**
   * Unique identifier for stats record (Primary Key)
   * Always set to 'global' - this is a singleton table
   */
  statId: string;

  /**
   * Total revenue collected by platform (in USDC smallest unit)
   * Represents protocol fees (typically 10% of prize pools)
   * Incremented on every raffle entry
   * 1 USDC = 1,000,000 (6 decimals)
   *
   * Calculation: Sum of all protocolFee from completed raffles
   */
  totalRevenue: number;

  /**
   * Total amount paid out to winners (in USDC smallest unit)
   * Represents actual payouts to users (typically 90% of prize pools)
   * Incremented when payouts are processed
   *
   * Formula: totalRevenue * winnerSharePercent (usually 90%)
   */
  totalPaidOut: number;

  /**
   * Total number of raffles created across platform
   * Incremented when admin creates a new raffle
   * Includes all raffle types: daily, weekly, monthly, flash, mega
   */
  totalRaffles: number;

  /**
   * Total number of entries (ticket purchases) across all raffles
   * Incremented on every entry transaction
   * Each user can buy multiple entries per raffle
   */
  totalEntries: number;

  /**
   * Total number of unique users (wallet addresses)
   * Incremented when a new user makes their first entry
   * Represents unique wallets that have interacted with platform
   */
  totalUsers: number;

  /**
   * Total number of winners across all raffles
   * Incremented when winners are selected via VRF
   * One raffle can have multiple winners (1st, 2nd, 3rd place, etc.)
   */
  totalWinners: number;

  /**
   * Detailed payout statistics (optional nested object)
   * Provides granular insights into payout operations
   */
  payoutStats?: {
    /**
     * Total amount successfully paid (should equal totalPaidOut)
     * Used for reconciliation
     */
    totalPaid: number;

    /**
     * Amount paid out this month (rolling 30 days)
     * Useful for monthly financial reports
     */
    thisMonth: number;

    /**
     * Amount paid out this week (rolling 7 days)
     * Useful for weekly dashboards
     */
    thisWeek: number;

    /**
     * Average payout amount per winner
     * Calculated as: totalPaid / totalCount
     */
    avgPayout: number;

    /**
     * Total number of payout transactions
     * May differ from totalWinners if payouts fail and retry
     */
    totalCount: number;

    /**
     * Number of payouts waiting to be processed
     * High value indicates processing backlog
     */
    pendingCount: number;

    /**
     * Number of failed payout attempts
     * Requires investigation if non-zero
     */
    failedCount: number;
  };

  /**
   * Revenue breakdown by game type (optional)
   * Enables tracking which games generate most revenue
   * Useful for business decisions and game prioritization
   */
  revenueByGame?: {
    /**
     * Revenue from raffle games
     */
    raffle: number;

    // Future game types:
    // slots: number;
    // poker: number;
    // lottery: number;
  };

  /**
   * Last blockchain block number that was synced (optional)
   * Used by event sync service to track progress
   * Incremented after successful event sync
   *
   * Example: 12345678
   *
   * Usage:
   * - Event sync fetches events from lastSyncedBlock+1 to latest
   * - Prevents duplicate event processing
   * - Enables recovery from sync failures
   */
  lastSyncedBlock?: number;

  /**
   * ISO 8601 timestamp of last successful event sync (optional)
   * Example: "2025-01-31T10:30:00.000Z"
   *
   * Used for:
   * - Monitoring sync health
   * - Detecting sync lag (should be within 30 seconds)
   * - Alerting if sync hasn't run recently
   */
  lastSyncedAt?: string;

  /**
   * Last error message from event sync (optional)
   * Set when sync encounters errors but continues (best-effort)
   * Cleared on next successful sync with no errors
   *
   * Example: "3 errors occurred during sync"
   *
   * If present, indicates partial sync success
   */
  lastSyncError?: string;

  /**
   * ISO 8601 timestamp of when platform stats were initialized
   * Set once when record is created, never updated
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last stats update
   * Updated on every increment operation
   * Useful for monitoring stats freshness
   */
  updatedAt: string;
}

/**
 * Helper type for atomic increment operations
 *
 * Used by StatsRepository.increment() to atomically
 * update multiple counters in a single DynamoDB operation.
 *
 * Example Usage:
 * ```typescript
 * await statsRepo.increment({
 *   totalEntries: 1,
 *   totalRevenue: 100000000, // 100 USDC
 *   totalUsers: 1
 * });
 * ```
 */
export type StatsIncrements = {
  totalRaffles?: number;
  totalEntries?: number;
  totalRevenue?: number;
  totalPaidOut?: number;
  totalWinners?: number;
  totalUsers?: number;
};
