/**
 * Blockchain Client - Contract Interaction Layer
 *
 * Provides React hooks for interacting with FairWin smart contracts.
 * Uses viem + wagmi for type-safe, efficient contract calls.
 */

'use client';

import { getContract, type Address } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContractAddress } from './addresses';
import FairWinRaffleABI from './contract-interfaces/FairWinRaffle.json';

/**
 * FairWin Raffle Contract ABI
 * Application Binary Interface - defines how to interact with the contract
 */
export const FAIRWIN_ABI = FairWinRaffleABI;

/**
 * Hook to interact with FairWin Raffle contract
 *
 * @param chainId - Chain ID to use (defaults to Polygon Mainnet = 137)
 * @returns Contract instances and addresses
 *
 * @example
 * const { readContract, writeContract, raffleAddress } = useFairWinContract();
 *
 * // Read from contract (free, no wallet needed)
 * const raffle = await readContract.read.raffles([raffleId]);
 *
 * // Write to contract (costs gas, requires connected wallet)
 * await writeContract.write.enterRaffle([raffleId, numEntries]);
 */
export function useFairWinContract(chainId: number = 137) {
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  const addresses = getContractAddress(chainId);

  /**
   * Read-only contract instance
   * Use for querying contract state (free, no gas cost)
   */
  const readContract = publicClient
    ? getContract({
        address: addresses.raffle,
        abi: FAIRWIN_ABI,
        client: publicClient,
      })
    : null;

  /**
   * Write contract instance
   * Use for transactions that modify state (costs gas, requires wallet)
   */
  const writeContract = walletClient
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

/**
 * ERC20 ABI (for USDC interactions)
 *
 * Standard functions needed to interact with USDC token:
 * - approve: Allow contract to spend your USDC
 * - allowance: Check how much contract can spend
 * - balanceOf: Check USDC balance
 * - decimals: Get token decimals (USDC = 6)
 */
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
