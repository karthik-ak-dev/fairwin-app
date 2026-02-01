/**
 * Wallet Balance Service
 *
 * Queries wallet balances for native token (MATIC) and ERC20 tokens (USDC, LINK).
 */

'use client';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { formatUnits } from 'viem';
import { config } from '@/lib/wagmi/config';
import { ERC20_ABI, getContractAddress } from '@/lib/blockchain';
import { blockchain } from '@/lib/constants';
import type { TokenBalances, WalletBalances } from '../types';
import { ContractReadError } from '../errors';

// LINK token address (for Chainlink VRF)
const LINK_ADDRESSES: Record<number, string> = {
  137: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1', // Polygon Mainnet
  80002: '0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904', // Polygon Amoy Testnet
};

/**
 * Get the appropriate public client for the chain
 */
function getClient(chainId: number = blockchain.DEFAULT_CHAIN_ID) {
  const chain = chainId === blockchain.CHAIN_IDS.POLYGON_MAINNET ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}

/**
 * Get MATIC balance
 *
 * @param address Wallet address
 * @param chainId Chain ID (Polygon Mainnet, 80002 = Amoy)
 * @returns Balance in wei
 */
export async function getMaticBalance(
  address: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<bigint> {
  try {
    const client = getClient(chainId);
    const balance = await client.getBalance({
      address: address as `0x${string}`,
    });

    return balance;
  } catch (error) {
    throw new ContractReadError(
      'getBalance',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get USDC balance
 *
 * @param address Wallet address
 * @param chainId Chain ID
 * @returns Balance in smallest unit (6 decimals for USDC)
 */
export async function getUSDCBalance(
  address: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<bigint> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    const balance = await client.readContract({
      address: addresses.usdc,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    return balance as bigint;
  } catch (error) {
    throw new ContractReadError(
      'balanceOf',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get LINK balance
 *
 * @param address Wallet address
 * @param chainId Chain ID
 * @returns Balance in smallest unit (18 decimals for LINK)
 */
export async function getLinkBalance(
  address: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<bigint> {
  try {
    const client = getClient(chainId);
    const linkAddress = LINK_ADDRESSES[chainId];

    if (!linkAddress) {
      throw new Error(`LINK address not configured for chain ${chainId}`);
    }

    const balance = await client.readContract({
      address: linkAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    return balance as bigint;
  } catch (error) {
    throw new ContractReadError(
      'balanceOf',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get all token balances
 *
 * @param address Wallet address
 * @param chainId Chain ID
 * @returns Object with all balances and formatted values
 */
export async function getAllBalances(
  address: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<WalletBalances> {
  // Fetch all balances in parallel
  const [matic, usdc, link] = await Promise.all([
    getMaticBalance(address, chainId),
    getUSDCBalance(address, chainId),
    getLinkBalance(address, chainId),
  ]);

  const balances: TokenBalances = {
    matic,
    usdc,
    link,
  };

  // Format balances for display
  const formatted = {
    matic: formatUnits(matic, 18), // MATIC has 18 decimals
    usdc: formatUnits(usdc, 6), // USDC has 6 decimals
    link: formatUnits(link, 18), // LINK has 18 decimals
  };

  return {
    address,
    balances,
    formatted,
  };
}

/**
 * Check if wallet has sufficient balance for operation
 *
 * @param address Wallet address
 * @param token Token to check ('matic' | 'usdc' | 'link')
 * @param amount Required amount in token's smallest unit
 * @param chainId Chain ID
 * @returns true if sufficient balance, false otherwise
 */
export async function hasSufficientBalance(
  address: string,
  token: 'matic' | 'usdc' | 'link',
  amount: bigint,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<boolean> {
  let balance: bigint;

  switch (token) {
    case 'matic':
      balance = await getMaticBalance(address, chainId);
      break;
    case 'usdc':
      balance = await getUSDCBalance(address, chainId);
      break;
    case 'link':
      balance = await getLinkBalance(address, chainId);
      break;
    default:
      return false;
  }

  return balance >= amount;
}

/**
 * Format token amount for display
 *
 * @param amount Amount in smallest unit
 * @param token Token type
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: bigint,
  token: 'matic' | 'usdc' | 'link'
): string {
  const decimals = token === 'usdc' ? 6 : 18;
  return formatUnits(amount, decimals);
}
