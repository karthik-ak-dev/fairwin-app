/**
 * Contract Read Service
 *
 * Handles reading state from the FairWin smart contract.
 * Provides typed wrappers around contract read operations.
 */

'use client';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { decodeEventLog } from 'viem';
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

    // Parse logs for EntrySubmitted event
    const entryLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'EntrySubmitted' && log.address.toLowerCase() === addresses.raffle.toLowerCase();
      } catch {
        return false;
      }
    });

    if (!entryLog) {
      return { valid: false };
    }

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
      functionName: 'getRaffleWinners',
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

    // Parse logs for WinnersSelected event (which includes prize payout)
    const payoutLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'WinnersSelected';
      } catch {
        return false;
      }
    });

    if (!payoutLog) {
      return { valid: false };
    }

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

/**
 * Get token balances for an address
 *
 * Reads MATIC, USDC, and LINK balances for the given address
 *
 * @throws ContractReadError if read fails
 */
export async function getTokenBalances(
  address: string,
  chainId: number = 137
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

/**
 * Get total protocol fees collected by contract
 *
 * This is the source of truth for fee tracking.
 * Contract tracks all fees collected from raffles in `protocolFeesCollected` variable.
 * Admin can withdraw these fees using withdrawFees() function.
 *
 * @param chainId Chain ID
 * @returns Total fees collected in USDC (smallest unit, 6 decimals)
 * @throws ContractReadError if read fails
 */
export async function getProtocolFeesCollected(
  chainId: number = 137
): Promise<bigint> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    const fees = await client.readContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'accumulatedFees', // NOTE: ABI function name is accumulatedFees
    });

    return fees as bigint;
  } catch (error) {
    throw new ContractReadError(
      'accumulatedFees',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
