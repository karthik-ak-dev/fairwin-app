'use client';

import { useReadContract } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import { ERC20_ABI, USDC_CONTRACT_ADDRESS } from '@/features/raffle/contract';

interface UseTokenBalanceOptions {
  address?: Address;
}

export function useTokenBalance({ address }: UseTokenBalanceOptions = {}) {
  const { data: rawBalance, isLoading, refetch } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balance = rawBalance as bigint | undefined;
  const formatted = balance !== undefined ? formatUnits(balance, 6) : '0';
  const balanceNumber = balance !== undefined ? parseFloat(formatUnits(balance, 6)) : 0;

  return { balance, formatted, balanceNumber, isLoading, refetch };
}
