/**
 * Admin Dashboard Stats Hooks
 *
 * React Query hooks for fetching admin dashboard statistics
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { DashboardStats } from '@/lib/services/admin/types';

// ============================================================================
// Query Keys
// ============================================================================

export const adminDashboardQueryKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: () => [...adminDashboardQueryKeys.all, 'stats'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchDashboardStats(): Promise<DashboardStats> {
  // TODO: Uncomment when ready to use real API
  // const response = await fetch('/api/admin/dashboard/stats');
  //
  // if (!response.ok) {
  //   throw new Error('Failed to fetch dashboard stats');
  // }
  //
  // const data = await response.json();
  // return data.stats;

  // Dummy data for development
  return {
    totalValueLocked: 125000,
    activeRafflesCount: 8,
    endingSoonCount: 2,
    entriesToday: 47,
    revenueThisWeek: 3250,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get admin dashboard statistics
 *
 * Fetches real-time statistics including:
 * - Total Value Locked (sum of active raffle prize pools)
 * - Active raffles count
 * - Ending soon count (raffles with < 5min remaining)
 * - Entries created today
 * - Revenue this week (protocol fees from last 7 days)
 *
 * @param options - React Query options
 * @returns Dashboard stats query result
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDashboardStats();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <StatCard label="TVL" value={data.totalValueLocked} />
 *     <StatCard label="Active Raffles" value={data.activeRafflesCount} />
 *     <StatCard label="Ending Soon" value={data.endingSoonCount} />
 *     <StatCard label="Entries Today" value={data.entriesToday} />
 *     <StatCard label="Revenue This Week" value={data.revenueThisWeek} />
 *   </div>
 * );
 * ```
 */
export function useDashboardStats(
  options?: Omit<UseQueryOptions<DashboardStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: adminDashboardQueryKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 30, // 30 seconds (dashboard stats should be fairly fresh)
    refetchInterval: 1000 * 60, // Auto-refetch every 60 seconds
    ...options,
  });
}
