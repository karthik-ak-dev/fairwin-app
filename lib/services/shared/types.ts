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

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
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
    avgAmount: number;
  };
}

export interface TypeStats {
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';
  count: number;
  totalRevenue: number;
  avgPoolSize: number;
}

export interface RevenueData {
  period: string; // ISO date string
  revenue: number;
  raffleCount: number;
  entryCount: number;
}
