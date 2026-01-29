'use client';

import { getContract, type Address } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContractAddress } from './addresses';
import FairWinRaffleABI from './abi/FairWinRaffle.json';

export const FAIRWIN_ABI = FairWinRaffleABI;

export function useFairWinContract(chainId: number = 137) {
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  const addresses = getContractAddress(chainId);

  const readContract = publicClient
    ? getContract({
        address: addresses.raffle,
        abi: FAIRWIN_ABI,
        client: publicClient,
      })
    : null;

  const writeContract =
    walletClient
      ? getContract({
          address: addresses.raffle,
          abi: FAIRWIN_ABI,
          client: walletClient,
        })
      : null;

  return {
    readContract,
    writeContract,
    raffleAddress: addresses.raffle,
    usdcAddress: addresses.usdc,
    chainId,
  };
}

// ERC20 ABI for USDC approve/allowance
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
