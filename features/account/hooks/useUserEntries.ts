'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserEntries } from '../api';

export function useUserEntries(address?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-entries', address],
    queryFn: () => getUserEntries(address!),
    enabled: !!address,
    staleTime: 15_000,
  });

  return {
    entries: data?.entries ?? [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    refetch,
  };
}
