'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserEntries } from '../api';

export function useUserHistory(address?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-history', address],
    queryFn: () => getUserEntries(address!, 50),
    enabled: !!address,
    staleTime: 15_000,
  });

  return {
    history: data?.entries ?? [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    refetch,
  };
}
