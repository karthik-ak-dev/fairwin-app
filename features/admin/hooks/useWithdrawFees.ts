'use client';

import { useState, useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { RAFFLE_CONTRACT_ADDRESS, RAFFLE_ABI } from '@/features/raffle/contract';

type WithdrawStep = 'idle' | 'withdrawing' | 'confirming' | 'done' | 'error';

export function useWithdrawFees() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<WithdrawStep>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const withdraw = useCallback(
    async (amount: number) => {
      try {
        setError(null);
        setStep('withdrawing');

        const amountInWei = parseUnits(String(amount), 6);

        const hash = await writeContractAsync({
          address: RAFFLE_CONTRACT_ADDRESS,
          abi: RAFFLE_ABI,
          functionName: 'withdrawFees',
          args: [amountInWei],
        });

        setTxHash(hash);
        setStep('confirming');

        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });

        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to withdraw fees'));
        setStep('error');
      }
    },
    [writeContractAsync, queryClient],
  );

  const reset = useCallback(() => {
    setStep('idle');
    setTxHash(undefined);
    setError(null);
  }, []);

  return {
    withdraw,
    reset,
    step,
    txHash,
    error,
    isWithdrawing: step === 'withdrawing' || step === 'confirming',
    isSuccess: step === 'done',
  };
}
