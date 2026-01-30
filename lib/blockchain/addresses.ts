/**
 * Contract Addresses and Chain Configuration
 *
 * Centralized management of deployed contract addresses across different chains.
 * All addresses should be verified on official block explorers before use.
 */

import { type Address } from 'viem';

/**
 * Main FairWin Raffle contract address
 * Set via environment variable for security and flexibility
 */
export const FAIRWIN_RAFFLE_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
) as Address;

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
export const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC_CONTRACT || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
) as Address;

/**
 * Default chain ID (Polygon Mainnet)
 */
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137', 10);

/**
 * Chain-specific contract addresses
 *
 * Maps chain ID to deployed contract addresses
 * Makes it easy to support multiple networks
 */
export const CONTRACT_ADDRESSES: Record<number, { raffle: Address; usdc: Address; link: Address }> = {
  // Polygon Mainnet
  137: {
    raffle: FAIRWIN_RAFFLE_ADDRESS,
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address, // Official USDC
    link: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39' as Address, // Chainlink LINK on Polygon
  },
  // Polygon Amoy Testnet
  80002: {
    raffle: FAIRWIN_RAFFLE_ADDRESS,
    usdc: '0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660' as Address, // Testnet USDC
    link: '0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904' as Address, // LINK on Amoy Testnet
  },
};

/**
 * Get contract addresses for a specific chain
 *
 * @param chainId - The chain ID to get addresses for
 * @returns Object containing raffle, USDC, and LINK contract addresses
 *
 * @example
 * const addresses = getContractAddress(137); // Polygon Mainnet
 * console.log(addresses.raffle); // FairWin Raffle contract address
 * console.log(addresses.usdc);   // USDC contract address
 * console.log(addresses.link);   // LINK contract address
 */
export function getContractAddress(chainId: number): { raffle: Address; usdc: Address; link: Address } {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[137]; // Default to Polygon Mainnet
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
  const base = process.env.NEXT_PUBLIC_POLYGONSCAN_URL || 'https://polygonscan.com';
  return `${base}/tx/${hash}`;
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
  const base = process.env.NEXT_PUBLIC_POLYGONSCAN_URL || 'https://polygonscan.com';
  return `${base}/address/${address}`;
}
