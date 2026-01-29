'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useAccount } from 'wagmi';
import { enterRaffle } from '../api';
import { RAFFLE_ABI, RAFFLE_CONTRACT_ADDRESS } from '../contract';

type EntryStep = 'idle' | 'entering' | 'confirming' | 'recording' | 'done' | 'error';

interface EnterRaffleParams {
  walletAddress: string;
  numEntries: number;
  entryPrice: number;
}

export function useEnterRaffle(raffleId: string) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<EntryStep>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const enter = useCallback(
    async ({ walletAddress, numEntries, entryPrice }: EnterRaffleParams) => {
      try {
        setError(null);
        setStep('entering');

        const hash = await writeContractAsync({
          address: RAFFLE_CONTRACT_ADDRESS,
          abi: RAFFLE_ABI,
          functionName: 'enterRaffle',
          args: [BigInt(raffleId), BigInt(numEntries)],
        });

        setTxHash(hash);
        setStep('confirming');

        setStep('recording');
        const totalPaid = numEntries * entryPrice;
        await enterRaffle(raffleId, {
          walletAddress,
          numEntries,
          totalPaid,
          transactionHash: hash,
          blockNumber: 0,
        });

        queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] });
        queryClient.invalidateQueries({ queryKey: ['raffle-participants', raffleId] });
        queryClient.invalidateQueries({ queryKey: ['raffles'] });
        queryClient.invalidateQueries({ queryKey: ['user-stats', address] });
        queryClient.invalidateQueries({ queryKey: ['user-entries', address] });

        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to enter raffle'));
        setStep('error');
      }
    },
    [raffleId, address, writeContractAsync, queryClient],
  );

  const reset = useCallback(() => {
    setStep('idle');
    setTxHash(undefined);
    setError(null);
  }, []);

  return {
    enter,
    reset,
    step,
    txHash,
    error,
    isEntering: step === 'entering' || step === 'confirming' || step === 'recording',
    isSuccess: step === 'done',
    isPending: step !== 'idle' && step !== 'done' && step !== 'error',
  };
}
