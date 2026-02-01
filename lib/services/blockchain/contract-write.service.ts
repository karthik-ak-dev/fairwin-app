/**
 * Contract Write Service
 *
 * Handles generic blockchain write operations (USDC approvals, gas estimation).
 * For raffle-specific operations, see lib/services/raffle/raffle-blockchain.service.ts
 */

'use client';

import { getWalletClient, getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { config } from '@/lib/wagmi/config';
import { ERC20_ABI, getContractAddress } from '@/lib/blockchain';
import { ContractWriteError } from '../errors';

/**
 * Get the appropriate clients for the chain
 */
async function getClients(chainId: number = 137) {
  const chain = chainId === 137 ? polygon : polygonAmoy;
  const publicClient = getPublicClient(config, { chainId: chain.id });
  const walletClient = await getWalletClient(config, { chainId: chain.id });
  return { publicClient, walletClient };
}

/**
 * Approve USDC spending for raffle contract
 *
 * Called by users before entering raffles
 *
 * @throws ContractWriteError if approval fails
 */
export async function approveUSDC(
  amount: bigint,
  chainId: number = 137
): Promise<string> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('approve', 'No wallet connected');
    }

    // Execute approval
    const hash = await walletClient.writeContract({
      address: addresses.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [addresses.raffle, amount],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('approve', 'Transaction failed');
    }

    return hash;
  } catch (error) {
    throw new ContractWriteError(
      'approve',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Check USDC allowance
 *
 * Returns how much USDC the contract is allowed to spend on behalf of user
 */
export async function getUSDCAllowance(
  ownerAddress: string,
  chainId: number = 137
): Promise<bigint> {
  try {
    const { publicClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    const allowance = await publicClient.readContract({
      address: addresses.usdc,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress as `0x${string}`, addresses.raffle],
    });

    return allowance as bigint;
  } catch (error) {
    throw new ContractWriteError(
      'allowance',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

