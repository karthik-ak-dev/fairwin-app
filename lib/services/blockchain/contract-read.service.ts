/**
 * Contract Read Service
 *
 * Handles reading state from the FairWin smart contract.
 * Provides typed wrappers around contract read operations.
 */

'use client';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { config } from '@/lib/wagmi/config';
import { FAIRWIN_ABI, getContractAddress } from '@/lib/blockchain';
import type {
  ContractRaffle,
  EntryVerification,
  PayoutVerification,
} from '../types';
import { ContractReadError } from '../errors';

/**
 * Get the appropriate public client for the chain
 */
function getClient(chainId: number = 137) {
  const chain = chainId === 137 ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}

/**
 * Read raffle data from contract
 *
 * @throws ContractReadError if read fails
 */
export async function getRaffleFromContract(
  raffleId: string,
  chainId: number = 137
): Promise<ContractRaffle> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    const result = await client.readContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'raffles',
      args: [raffleId],
    });

    // Contract returns tuple: [prizePool, totalEntries, status, winner, ...]
    const [prizePool, totalEntries, status, winner] = result as [bigint, bigint, number, string];

    return {
      raffleId,
      prizePool,
      totalEntries,
      status,
      winner: winner !== '0x0000000000000000000000000000000000000000' ? winner : undefined,
    };
  } catch (error) {
    throw new ContractReadError(
      'raffles',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Verify entry transaction on-chain
 *
 * Reads transaction receipt to verify entry was recorded
 *
 * @throws ContractReadError if verification fails
 */
export async function verifyEntryOnChain(
  transactionHash: string,
  chainId: number = 137
): Promise<EntryVerification> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!receipt) {
      return { valid: false };
    }

    // Verify transaction was to raffle contract
    if (receipt.to?.toLowerCase() !== addresses.raffle.toLowerCase()) {
      return { valid: false };
    }

    // Verify transaction succeeded
    if (receipt.status !== 'success') {
      return { valid: false };
    }

    // Parse logs for EntryCreated event
    // Event signature: EntryCreated(string raffleId, address user, uint256 numEntries)
    const entryCreatedTopic = '0x...'; // TODO: Add actual event signature hash

    const entryLog = receipt.logs.find(
      (log) => log.topics[0] === entryCreatedTopic && log.address === addresses.raffle
    );

    if (!entryLog) {
      return { valid: false };
    }

    // Decode log data
    // TODO: Properly decode event data using ABI
    // For now, return basic validation
    return {
      valid: true,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error) {
    throw new ContractReadError(
      'verifyEntry',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get winners from contract for a raffle
 *
 * @throws ContractReadError if read fails
 */
export async function getWinnersFromContract(
  raffleId: string,
  chainId: number = 137
): Promise<string[]> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    const winners = await client.readContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'getWinners',
      args: [raffleId],
    });

    return winners as string[];
  } catch (error) {
    throw new ContractReadError(
      'getWinners',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Verify payout transaction on-chain
 *
 * @throws ContractReadError if verification fails
 */
export async function verifyPayoutTransaction(
  transactionHash: string,
  chainId: number = 137
): Promise<PayoutVerification> {
  try {
    const client = getClient(chainId);

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!receipt) {
      return { valid: false };
    }

    // Verify transaction succeeded
    if (receipt.status !== 'success') {
      return { valid: false };
    }

    // Parse logs for payout event or USDC transfer
    // TODO: Properly parse payout event from logs

    return {
      valid: true,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error) {
    throw new ContractReadError(
      'verifyPayout',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get VRF request status from contract
 *
 * @throws ContractReadError if read fails
 */
export async function getVRFRequestStatus(
  requestId: string,
  chainId: number = 137
): Promise<{ fulfilled: boolean; randomNumber?: bigint }> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    const result = await client.readContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'vrfRequests',
      args: [requestId],
    });

    const [fulfilled, randomNumber] = result as [boolean, bigint];

    return {
      fulfilled,
      randomNumber: fulfilled ? randomNumber : undefined,
    };
  } catch (error) {
    throw new ContractReadError(
      'vrfRequests',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
