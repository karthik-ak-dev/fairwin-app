'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserWins } from '../api';

export function useUserWins(address?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-wins', address],
    queryFn: () => getUserWins(address!),
    enabled: !!address,
    staleTime: 30_000,
  });

  return {
    wins: data?.wins ?? [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    refetch,
  };
}
