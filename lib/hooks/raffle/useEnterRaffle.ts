'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { enterRaffle } from '@/lib/api/raffle';
import { USDC_CONTRACT_ADDRESS, ERC20_ABI } from '@/features/raffle/contract';
import { serverEnv } from '@/lib/env';

type EntryStep = 'idle' | 'transferring' | 'confirming' | 'recording' | 'done' | 'error';

interface EnterRaffleParams {
  walletAddress: string;
  numEntries: number;
  entryPrice: number;
}

/**
 * Hook to enter a raffle
 *
 * Handles the raffle entry flow:
 * 1. User transfers USDC directly to the platform wallet on Polygon
 * 2. Transaction is confirmed on-chain (typically 2-5 seconds)
 * 3. Backend verifies the USDC transaction by reading on-chain data
 * 4. Entry is recorded in the database with confirmed status
 */
export function useEnterRaffle(raffleId: string) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<EntryStep>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const enter = useCallback(
    async ({ walletAddress, numEntries, entryPrice }: EnterRaffleParams) => {
      try {
        setError(null);
        setStep('transferring');

        // Calculate total USDC to transfer (entry price is in USDC cents, convert to USDC wei)
        const totalPaid = numEntries * entryPrice;
        const usdcAmount = BigInt(totalPaid * 10000); // USDC has 6 decimals, price is in cents

        // Transfer USDC to platform wallet
        const hash = await writeContractAsync({
          address: USDC_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [
            serverEnv.PLATFORM_WALLET_ADDRESS as `0x${string}`,
            usdcAmount,
          ],
        });

        setTxHash(hash);
        setStep('confirming');

        // Wait for transaction to be mined
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        setStep('recording');

        // Call backend to verify and record entry
        await enterRaffle(raffleId, {
          walletAddress,
          numEntries,
          totalPaid,
          transactionHash: hash,
        });

        // Invalidate queries to refetch updated data
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
    [raffleId, address, writeContractAsync, publicClient, queryClient],
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
    isEntering: step === 'transferring' || step === 'confirming' || step === 'recording',
    isSuccess: step === 'done',
    isPending: step !== 'idle' && step !== 'done' && step !== 'error',
  };
}
