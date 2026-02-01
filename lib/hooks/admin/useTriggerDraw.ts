'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, adminHeaders } from '@/lib/api/client';

type DrawStep = 'idle' | 'drawing' | 'done' | 'error';

interface TriggerDrawResponse {
  raffle: any;
  winners: any[];
  message: string;
}

/**
 * Hook to trigger raffle draw
 *
 * Calls the backend API to instantly select winners using cryptographically
 * secure randomness. Winners are selected and stored in <1 second.
 */
export function useTriggerDraw() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<DrawStep>('idle');
  const [error, setError] = useState<Error | null>(null);

  const trigger = useCallback(
    async (raffleId: string) => {
      if (!address) {
        setError(new Error('Wallet not connected'));
        setStep('error');
        return;
      }

      try {
        setError(null);
        setStep('drawing');

        // Call backend API to trigger draw (instant, no blockchain)
        await apiClient<TriggerDrawResponse>(`/api/raffles/${raffleId}/draw`, {
          method: 'POST',
          headers: adminHeaders(address),
          body: JSON.stringify({
            useBlockHash: true, // Use block hash for random seed
          }),
        });

        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] });
        queryClient.invalidateQueries({ queryKey: ['raffles'] });
        queryClient.invalidateQueries({ queryKey: ['admin-raffles'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });

        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to trigger draw'));
        setStep('error');
      }
    },
    [address, queryClient],
  );

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
  }, []);

  return {
    trigger,
    reset,
    step,
    error,
    isTriggering: step === 'drawing',
    isSuccess: step === 'done',
  };
}
