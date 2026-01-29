import { type Address } from 'viem';

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_CONTRACT || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as Address;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137', 10);

export function polygonscanTx(hash: string) {
  const base = process.env.NEXT_PUBLIC_POLYGONSCAN_URL || 'https://polygonscan.com';
  return `${base}/tx/${hash}`;
}

export function polygonscanAddress(address: string) {
  const base = process.env.NEXT_PUBLIC_POLYGONSCAN_URL || 'https://polygonscan.com';
  return `${base}/address/${address}`;
}

/** Chain-keyed contract addresses used by lib/contracts/client.ts */
export const CONTRACT_ADDRESSES: Record<number, { raffle: Address; usdc: Address }> = {
  137: { raffle: CONTRACT_ADDRESS, usdc: USDC_ADDRESS },
  80002: {
    raffle: CONTRACT_ADDRESS,
    usdc: '0x41E94Eb71898E8A2eF47C1B6a4c8B1A0fAdf3660' as Address,
  },
};

export function getContractAddress(chainId: number): { raffle: Address; usdc: Address } {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[137];
}
