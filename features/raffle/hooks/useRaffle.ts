'use client';

import { useQuery } from '@tanstack/react-query';
import { getRaffle } from '../api';
import { mapRaffleItemToRaffle } from '../mappers';

export function useRaffle(raffleId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['raffle', raffleId],
    queryFn: () => getRaffle(raffleId),
    enabled: !!raffleId,
    staleTime: 5_000,
  });

  return {
    raffle: data?.raffle ? mapRaffleItemToRaffle(data.raffle) : undefined,
    recentEntries: data?.recentEntries,
    winners: data?.winners,
    isLoading,
    error,
    refetch,
  };
}
