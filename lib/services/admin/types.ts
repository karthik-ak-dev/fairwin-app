/**
 * Admin Service Types
 *
 * All types related to admin operations including:
 * - Dashboard statistics
 * - Admin queries
 */

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface DashboardStats {
  /**
   * Total Value Locked - Sum of all active raffle prize pools
   * Calculated from active raffles
   */
  totalValueLocked: number;

  /**
   * Number of currently active raffles
   */
  activeRafflesCount: number;

  /**
   * Number of raffles ending soon (displayStatus = 'ending')
   */
  endingSoonCount: number;

  /**
   * Number of entries created today (since midnight)
   */
  entriesToday: number;

  /**
   * Total revenue collected this week (last 7 days)
   * Sum of protocol fees from completed raffles
   */
  revenueThisWeek: number;
}
