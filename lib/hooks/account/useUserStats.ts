'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api';

export function useUserStats(address?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-stats', address],
    queryFn: () => getUserProfile(address!),
    enabled: !!address,
    staleTime: 30_000,
  });

  const user = data?.user;

  const stats = user
    ? {
        address: user.walletAddress,
        totalWon: user.totalWon,
        totalSpent: user.totalSpent,
        rafflesEntered: user.rafflesEntered,
        winRate: user.winRate,
        activeEntries: user.activeEntries,
      }
    : undefined;

  return {
    stats,
    totalWon: user?.totalWon ?? 0,
    totalSpent: user?.totalSpent ?? 0,
    rafflesEntered: user?.rafflesEntered ?? 0,
    winRate: user?.winRate ?? 0,
    activeEntries: user?.activeEntries ?? 0,
    isLoading,
    error,
    refetch,
  };
}
