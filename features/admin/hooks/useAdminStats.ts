'use client';

import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { getAdminStats } from '../api';
import type { AdminStats } from '../types';

export function useAdminStats() {
  const { address, isAdmin } = useAdmin();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminStats(address!),
    enabled: isAdmin && !!address,
    staleTime: 30_000,
  });

  const apiStats = data?.stats;
  const stats: AdminStats | undefined = apiStats
    ? {
        totalRevenue: apiStats.totalRevenue,
        revenueThisMonth: 0,
        activeRaffles: apiStats.totalRaffles ?? 0,
        totalEntries: apiStats.totalEntries,
        totalUsers: apiStats.totalUsers,
        avgPoolSize: 0,
      }
    : undefined;

  return {
    stats,
    rawStats: apiStats,
    isLoading,
    error,
    refetch,
  };
}
