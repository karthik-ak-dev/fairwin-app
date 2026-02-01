/**
 * Blockchain Client - USDC Interaction Layer
 *
 * Provides read-only blockchain clients and utilities for USDC token interactions.
 * Used for verifying USDC transfer transactions on Polygon blockchain.
 */

'use client';

import { createPublicClient, http, type PublicClient, type Address } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { getUSDCAddress } from './addresses';
import { env } from '@/lib/env';

/**
 * Get viem public client for reading blockchain data
 *
 * @param chainId - Chain ID (137 = Polygon Mainnet, 80002 = Polygon Amoy Testnet)
 * @returns Public client instance
 */
export function getPublicClient(chainId: number = env.CHAIN_ID): PublicClient {
  const chain = chainId === 137 ? polygon : polygonAmoy;

  return createPublicClient({
    chain,
    transport: http(env.RPC_URL),
  });
}

/**
 * ERC20 Transfer ABI
 *
 * Minimal ABI for USDC transfer verification.
 * Only includes the transfer function used for raffle entries.
 */
export const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * ERC20 ABI (for USDC interactions)
 *
 * Standard functions needed to interact with USDC token:
 * - transfer: Send USDC to another address
 * - balanceOf: Check USDC balance
 * - decimals: Get token decimals (USDC = 6)
 * - approve: Allow another address to spend your USDC (for future use)
 * - allowance: Check spending allowance (for future use)
 */
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
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

/**
 * Get USDC contract address for a chain
 *
 * @param chainId - Chain ID
 * @returns USDC contract address
 */
export function getUSDCContractAddress(chainId: number = env.CHAIN_ID): Address {
  return getUSDCAddress(chainId);
}
