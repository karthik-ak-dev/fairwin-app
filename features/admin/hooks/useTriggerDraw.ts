'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { RAFFLE_CONTRACT_ADDRESS, RAFFLE_ABI } from '@/features/raffle/contract';
import { triggerDraw } from '@/features/raffle/api';

type DrawStep = 'idle' | 'triggering' | 'confirming' | 'updating' | 'done' | 'error';

export function useTriggerDraw() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<DrawStep>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
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
        setStep('triggering');

        const hash = await writeContractAsync({
          address: RAFFLE_CONTRACT_ADDRESS,
          abi: RAFFLE_ABI,
          functionName: 'triggerDraw',
          args: [BigInt(raffleId)],
        });

        setTxHash(hash);
        setStep('confirming');

        setStep('updating');
        await triggerDraw(raffleId, address);

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
    [address, writeContractAsync, queryClient],
  );

  const reset = useCallback(() => {
    setStep('idle');
    setTxHash(undefined);
    setError(null);
  }, []);

  return {
    trigger,
    reset,
    step,
    txHash,
    error,
    isTriggering: step === 'triggering' || step === 'confirming' || step === 'updating',
    isSuccess: step === 'done',
  };
}
