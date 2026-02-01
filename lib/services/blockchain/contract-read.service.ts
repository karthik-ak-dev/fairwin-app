/**
 * Contract Read Service
 *
 * Handles generic blockchain read operations (token balances).
 * For raffle-specific operations, see lib/services/raffle/raffle-blockchain.service.ts
 */

'use client';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { config } from '@/lib/wagmi/config';
import { getContractAddress } from '@/lib/blockchain';
import { blockchain } from '@/lib/constants';
import { ContractReadError } from '../errors';

/**
 * Get the appropriate public client for the chain
 */
function getClient(chainId: number = blockchain.DEFAULT_CHAIN_ID) {
  const chain = chainId === blockchain.CHAIN_IDS.POLYGON_MAINNET ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}


/**
 * Get token balances for an address
 *
 * Reads MATIC, USDC, and LINK balances for the given address
 *
 * @throws ContractReadError if read fails
 */
export async function getTokenBalances(
  address: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<{ matic: bigint; usdc: bigint; link: bigint }> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // ERC20 balanceOf ABI
    const erc20BalanceAbi = [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ] as const;

    // Fetch all balances in parallel
    const [maticBalance, usdcBalance, linkBalance] = await Promise.all([
      // Get MATIC balance (native token)
      client.getBalance({ address: address as `0x${string}` }),

      // Get USDC balance
      client.readContract({
        address: addresses.usdc,
        abi: erc20BalanceAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),

      // Get LINK balance
      client.readContract({
        address: addresses.link,
        abi: erc20BalanceAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
    ]);

    return {
      matic: maticBalance,
      usdc: usdcBalance as bigint,
      link: linkBalance as bigint,
    };
  } catch (error) {
    throw new ContractReadError(
      'getTokenBalances',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

