'use client';

import { useQuery } from '@tanstack/react-query';
import { getRaffles } from '@/features/raffle/api';
import { mapRaffleItemToRaffle } from '@/features/raffle/mappers';

interface UseAdminRafflesOptions {
  filter?: string;
}

export function useAdminRaffles(options: UseAdminRafflesOptions = {}) {
  const { filter = 'all' } = options;
  const queryFilter = filter !== 'all' ? { status: filter } : undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-raffles', filter],
    queryFn: () => getRaffles(queryFilter),
    staleTime: 10_000,
  });

  return {
    raffles: (data?.raffles ?? []).map(mapRaffleItemToRaffle),
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    refetch,
  };
}
