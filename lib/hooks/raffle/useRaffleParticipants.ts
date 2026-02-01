'use client';

import { useQuery } from '@tanstack/react-query';
import { getParticipants } from '../api';

export function useRaffleParticipants(raffleId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['raffle-participants', raffleId],
    queryFn: () => getParticipants(raffleId),
    enabled: !!raffleId,
    staleTime: 15_000,
  });

  return {
    participants: data?.participants ?? [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    refetch,
  };
}
