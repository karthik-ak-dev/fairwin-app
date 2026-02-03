/**
 * Platform Stats Hooks
 *
 * React Query hooks for platform statistics
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { PlatformStats } from '@/lib/services/shared/types';

// ============================================================================
// Query Keys
// ============================================================================

export const platformStatsKeys = {
  all: ['platformStats'] as const,
  stats: () => [...platformStatsKeys.all, 'stats'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchPlatformStats(): Promise<{ stats: PlatformStats }> {
  const response = await fetch('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch platform stats');
  }

  return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get platform statistics (admin only)
 *
 * @param options - React Query options
 * @returns Platform stats query result
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePlatformStats();
 * console.log(data?.stats.totalRevenue);
 * ```
 */
export function usePlatformStats(
  options?: Omit<UseQueryOptions<{ stats: PlatformStats }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: platformStatsKeys.stats(),
    queryFn: fetchPlatformStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
