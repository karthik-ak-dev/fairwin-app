/**
 * Blockchain Client - Centralized Blockchain Configuration
 *
 * All blockchain-related constants, ABIs, and clients are centralized here.
 * This is the single source of truth for:
 * - USDC contract addresses
 * - ERC20 ABIs
 * - Blockchain clients (public and wallet)
 * - Chain configuration
 */

'use client';

import { createPublicClient, createWalletClient, http, type PublicClient, type Address } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { env, serverEnv } from '@/lib/env';

/**
 * USDC Token Contract Addresses
 *
 * Official USDC addresses for different chains:
 * - Polygon Mainnet (137): Native USDC by Circle
 * - Polygon Amoy Testnet (80002): Testnet USDC
 */
export const USDC_ADDRESSES: Record<number, Address> = {
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon Mainnet - Official USDC
  80002: '0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660', // Polygon Amoy Testnet
} as const;

/**
 * Get USDC contract address for a specific chain
 *
 * @param chainId - Chain ID (default: from env)
 * @returns USDC contract address
 */
export function getUSDCAddress(chainId: number = env.CHAIN_ID): Address {
  return USDC_ADDRESSES[chainId] || USDC_ADDRESSES[137]; // Default to Polygon Mainnet
}

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
 * Get viem wallet client for sending transactions (server-side only)
 *
 * Uses operator private key from environment variables.
 * Should only be used in backend services for payouts.
 *
 * @param chainId - Chain ID (default: from env)
 * @returns Wallet client instance
 */
export function getWalletClient(chainId: number = env.CHAIN_ID) {
  const chain = chainId === 137 ? polygon : polygonAmoy;

  // Get private key from environment (in production, from AWS Secrets Manager)
  const privateKey = process.env.OPERATOR_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('OPERATOR_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
}

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
 * Get Polygonscan transaction URL
 *
 * @param hash - Transaction hash
 * @param chainId - Chain ID (default: from env)
 * @returns URL to view transaction on Polygonscan
 */
export function getPolygonscanTxUrl(hash: string, chainId: number = env.CHAIN_ID): string {
  const baseUrl = chainId === 137
    ? env.POLYGONSCAN_URL
    : 'https://amoy.polygonscan.com';
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Get Polygonscan address URL
 *
 * @param address - Contract or wallet address
 * @param chainId - Chain ID (default: from env)
 * @returns URL to view address on Polygonscan
 */
export function getPolygonscanAddressUrl(address: string, chainId: number = env.CHAIN_ID): string {
  const baseUrl = chainId === 137
    ? env.POLYGONSCAN_URL
    : 'https://amoy.polygonscan.com';
  return `${baseUrl}/address/${address}`;
}

