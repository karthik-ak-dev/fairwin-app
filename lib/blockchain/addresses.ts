/**
 * USDC Contract Addresses and Chain Configuration
 *
 * Contains USDC token addresses for payment verification on Polygon.
 * All addresses are verified on official block explorers (Polygonscan).
 */

import { type Address } from 'viem';
import { env } from '@/lib/env';

/**
 * USDC Token Contract Addresses
 *
 * Polygon Mainnet (137): 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
 * - Official USDC by Circle (native USDC, not bridged)
 * - Verify at: https://polygonscan.com/token/0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
 *
 * Polygon Amoy Testnet (80002): 0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660
 * - USDC Faucet available at: https://faucet.circle.com/
 */
export const USDC_ADDRESS = env.USDC_CONTRACT as Address;

/**
 * Default chain ID (Polygon Mainnet)
 */
export const CHAIN_ID = env.CHAIN_ID;

/**
 * Chain-specific USDC addresses
 *
 * Maps chain ID to USDC contract address
 */
export const USDC_ADDRESSES: Record<number, Address> = {
  // Polygon Mainnet
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address, // Official USDC
  // Polygon Amoy Testnet
  80002: '0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660' as Address, // Testnet USDC
};

/**
 * Get USDC contract address for a specific chain
 *
 * @param chainId - The chain ID to get USDC address for
 * @returns USDC contract address
 *
 * @example
 * const usdc = getUSDCAddress(137); // Polygon Mainnet
 * console.log(usdc); // 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
 */
export function getUSDCAddress(chainId: number): Address {
  return USDC_ADDRESSES[chainId] || USDC_ADDRESSES[137]; // Default to Polygon Mainnet
}

/**
 * Get Polygonscan transaction URL
 *
 * @param hash - Transaction hash
 * @returns URL to view transaction on Polygonscan
 *
 * @example
 * const url = polygonscanTx('0x1234...');
 * // https://polygonscan.com/tx/0x1234...
 */
export function polygonscanTx(hash: string): string {
  return `${env.POLYGONSCAN_URL}/tx/${hash}`;
}

/**
 * Get Polygonscan address URL
 *
 * @param address - Contract or wallet address
 * @returns URL to view address on Polygonscan
 *
 * @example
 * const url = polygonscanAddress('0xABC...');
 * // https://polygonscan.com/address/0xABC...
 */
export function polygonscanAddress(address: string): string {
  return `${env.POLYGONSCAN_URL}/address/${address}`;
}
