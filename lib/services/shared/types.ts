/**
 * Shared Service Types
 *
 * Cross-domain types used across multiple service areas including:
 * - Pagination
 * - Platform-wide statistics
 * - Common utilities
 */

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

// ============================================================================
// Platform Stats Types
// ============================================================================

export interface PlatformStats {
  totalRevenue: number;
  totalPaidOut: number;
  totalRaffles: number;
  totalEntries: number;
  totalUsers: number;
  totalWinners: number;
  activeRaffles: number;
  avgPoolSize: number;
  payoutStats: {
    pending: number;
    paid: number;
    failed: number;
    processing: number;
    avgAmount: number;
  };
}
