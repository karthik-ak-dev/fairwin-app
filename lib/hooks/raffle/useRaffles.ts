'use client';

import { useQuery } from '@tanstack/react-query';
import { getRaffles } from '../api';
import { mapRaffleItemToRaffle } from '../mappers';

export function useRaffles(filter?: { status?: string; type?: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['raffles', filter],
    queryFn: () => getRaffles(filter),
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
