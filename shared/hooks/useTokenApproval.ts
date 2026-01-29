'use client';

import { useCallback } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { type Address, parseUnits, maxUint256 } from 'viem';
import { ERC20_ABI, USDC_CONTRACT_ADDRESS, RAFFLE_CONTRACT_ADDRESS } from '@/features/raffle/contract';

interface UseTokenApprovalOptions {
  owner?: Address;
  amount?: number;
}

export function useTokenApproval({ owner, amount = 0 }: UseTokenApprovalOptions = {}) {
  const amountInWei = parseUnits(String(amount), 6);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, RAFFLE_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!owner },
  });

  const { writeContractAsync, isPending: isApproving } = useWriteContract();

  const isApproved = allowance !== undefined && allowance >= amountInWei;

  const approve = useCallback(async () => {
    if (!owner) throw new Error('Wallet not connected');
    await writeContractAsync({
      address: USDC_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RAFFLE_CONTRACT_ADDRESS, maxUint256],
    });
    await refetchAllowance();
  }, [owner, writeContractAsync, refetchAllowance]);

  function isApprovedFor(amountToCheck: number): boolean {
    if (allowance === undefined) return false;
    return allowance >= parseUnits(String(amountToCheck), 6);
  }

  return {
    allowance,
    isApproved,
    isApprovedFor,
    approve,
    isApproving,
    refetchAllowance,
  };
}
