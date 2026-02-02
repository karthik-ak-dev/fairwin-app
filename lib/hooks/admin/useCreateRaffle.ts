'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { createRaffle } from '@/lib/api/raffle';
import type { RaffleItem, CreateRaffleInput } from '@/lib/db/models';

interface CreateRaffleFormInput {
  title: string;
  type: string;
  entryPrice: number;
  duration: number;
  winnersCount: number;
  description?: string;
}

export function useCreateRaffle() {
  const queryClient = useQueryClient();
  const { address } = useAdmin();

  const { mutate, mutateAsync, isPending, isSuccess, error, data, reset } = useMutation<
    { raffle: RaffleItem },
    Error,
    CreateRaffleFormInput
  >({
    mutationFn: async (input) => {
      if (!address) throw new Error('Not authenticated');

      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + input.duration * 1000).toISOString();

      const payload: CreateRaffleInput = {
        type: input.type as CreateRaffleInput['type'],
        title: input.title,
        description: input.description ?? '',
        entryPrice: input.entryPrice,
        winnerCount: input.winnersCount ?? 1,
        startTime,
        endTime,
      };

      return createRaffle(payload, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raffles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-raffles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    create: mutate,
    createAsync: mutateAsync,
    isCreating: isPending,
    isSuccess,
    error,
    data: data?.raffle,
    reset,
  };
}
