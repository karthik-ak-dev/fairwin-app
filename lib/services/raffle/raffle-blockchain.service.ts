/**
 * Raffle Blockchain Service
 *
 * Handles all blockchain operations specific to raffles.
 * Centralized location for raffle-related smart contract interactions.
 * Includes both read and write operations for raffles.
 */

'use client';

import { getWalletClient, getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { decodeEventLog } from 'viem';
import { config } from '@/lib/wagmi/config';
import { FAIRWIN_ABI, getContractAddress } from '@/lib/blockchain';
import type { RequestRandomnessResult, ContractRaffle } from '../types';
import { ContractWriteError, InsufficientFundsError, ContractReadError } from '../errors';

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
 * Get public client for reading blockchain data
 */
function getClient(chainId: number = 137) {
  const chain = chainId === 137 ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

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
 * Get total protocol fees collected by contract
 *
 * This is the source of truth for fee tracking.
 * Contract tracks all fees collected from raffles in `accumulatedFees` variable.
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
      functionName: 'accumulatedFees',
    });

    return fees as bigint;
  } catch (error) {
    throw new ContractReadError(
      'accumulatedFees',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create a new raffle on-chain
 *
 * Admin-only operation. Creates raffle on blockchain FIRST before database entry.
 * This ensures database cannot contain raffles that don't exist on-chain.
 *
 * Contract function: createRaffle(uint256 _entryFee, uint256 _duration, uint256 _maxEntriesPerUser)
 *
 * Flow:
 * 1. Call createRaffle() on smart contract
 * 2. Wait for transaction confirmation
 * 3. Parse RaffleCreated event to get contractRaffleId
 * 4. Return contractRaffleId and transaction hash
 * 5. Caller saves to database with contractRaffleId
 *
 * @param entryFee Entry price in USDC (smallest unit, 6 decimals)
 * @param durationSeconds Raffle duration in seconds
 * @param maxEntriesPerUser Maximum entries per user (0 = unlimited)
 * @param chainId Chain ID
 * @returns Contract raffle ID, transaction hash, and end time
 * @throws ContractWriteError if creation fails
 *
 * @example
 * // Create raffle with 1 USDC entry fee, 24h duration, max 50 entries per user
 * const result = await createRaffleOnChain(1_000_000, 86400, 50, 137);
 * // result = { contractRaffleId: "1", transactionHash: "0x...", endTime: 1234567890 }
 */
export async function createRaffleOnChain(
  entryFee: bigint,
  durationSeconds: bigint,
  maxEntriesPerUser: bigint,
  chainId: number = 137
): Promise<{
  contractRaffleId: string;
  transactionHash: string;
  endTime: number;
}> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('createRaffle', 'No wallet connected');
    }

    // Execute transaction
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'createRaffle',
      args: [entryFee, durationSeconds, maxEntriesPerUser],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('createRaffle', 'Transaction failed');
    }

    // Parse RaffleCreated event to get raffle ID
    const raffleLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'RaffleCreated';
      } catch {
        return false;
      }
    });

    if (!raffleLog) {
      throw new ContractWriteError(
        'createRaffle',
        'RaffleCreated event not found in transaction logs'
      );
    }

    // Decode event to extract raffle ID and end time
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: raffleLog.data,
      topics: raffleLog.topics,
    });

    const args = decoded.args as unknown as {
      raffleId: bigint;
      entryFee: bigint;
      endTime: bigint;
    };

    return {
      contractRaffleId: args.raffleId.toString(),
      transactionHash: hash,
      endTime: Number(args.endTime),
    };
  } catch (error) {
    throw new ContractWriteError(
      'createRaffle',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Cancel a raffle on-chain
 *
 * Admin-only operation. Cancels raffle on blockchain FIRST before database update.
 * This ensures database cannot mark raffles as cancelled when they're still active on-chain.
 *
 * Contract function: cancelRaffle(uint256 _raffleId)
 *
 * Rules:
 * - Can only cancel raffles in Active state
 * - Cannot cancel raffles in Drawing or Completed state
 * - Users can claim refunds after cancellation
 *
 * Flow:
 * 1. Call cancelRaffle() on smart contract
 * 2. Wait for transaction confirmation
 * 3. Verify RaffleCancelled event was emitted
 * 4. Return transaction hash
 * 5. Caller updates database status to 'cancelled'
 *
 * @param contractRaffleId On-chain raffle ID from contract
 * @param chainId Chain ID
 * @returns Transaction hash
 * @throws ContractWriteError if cancellation fails
 *
 * @example
 * await cancelRaffleOnChain("1", 137);
 */
export async function cancelRaffleOnChain(
  contractRaffleId: string,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('cancelRaffle', 'No wallet connected');
    }

    // Execute cancellation
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'cancelRaffle',
      args: [BigInt(contractRaffleId)],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('cancelRaffle', 'Transaction failed');
    }

    // Verify RaffleCancelled event was emitted
    const cancelLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'RaffleCancelled';
      } catch {
        return false;
      }
    });

    if (!cancelLog) {
      throw new ContractWriteError(
        'cancelRaffle',
        'RaffleCancelled event not found in transaction logs'
      );
    }

    return { transactionHash: hash };
  } catch (error) {
    throw new ContractWriteError(
      'cancelRaffle',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Emergency cancel a raffle stuck in Drawing state
 *
 * ONLY works if 12+ hours passed since draw triggered.
 * This is for cases when Chainlink VRF fails to respond.
 * Admin cannot abuse this - 12-hour delay prevents cancelling just because they don't like winners.
 *
 * Contract function: emergencyCancelDrawing(uint256 raffleId)
 *
 * @param raffleId Raffle ID to cancel
 * @param chainId Chain ID
 * @returns Transaction hash
 * @throws ContractWriteError if cancellation fails or 12-hour delay not met
 */
export async function emergencyCancelDrawing(
  raffleId: string,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('emergencyCancelDrawing', 'No wallet connected');
    }

    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'emergencyCancelDrawing',
      args: [BigInt(raffleId)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('emergencyCancelDrawing', 'Transaction failed');
    }

    return { transactionHash: hash };
  } catch (error) {
    throw new ContractWriteError('emergencyCancelDrawing', (error as Error).message);
  }
}

/**
 * Request random number from Chainlink VRF
 *
 * @throws ContractWriteError if request fails
 * @throws InsufficientFundsError if insufficient LINK balance
 */
export async function requestRandomness(
  raffleId: string,
  chainId: number = 137
): Promise<RequestRandomnessResult> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('requestRandomWords', 'No wallet connected');
    }

    // Estimate gas
    const gas = await publicClient.estimateContractGas({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'requestRandomWords',
      args: [raffleId],
      account: walletClient.account,
    });

    // Execute transaction
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'requestRandomWords',
      args: [raffleId],
      gas: gas + BigInt(10000), // Add buffer
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('requestRandomWords', 'Transaction failed');
    }

    // Parse logs for DrawRequested event
    const vrfLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'DrawRequested';
      } catch {
        return false;
      }
    });

    // Decode request ID from log
    let requestId = '0x0';
    if (vrfLog) {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: vrfLog.data,
          topics: vrfLog.topics,
        });
        requestId = (decoded.args as any).requestId?.toString() || '0x0';
      } catch {
        // If decoding fails, use a default value
      }
    }

    return {
      requestId,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('insufficient')) {
      throw new InsufficientFundsError('LINK', 'unknown');
    }

    throw new ContractWriteError(
      'requestRandomWords',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Withdraw accumulated protocol fees
 *
 * Admin-only operation to withdraw platform revenue.
 * Contract tracks fees in `protocolFeesCollected` variable.
 * Admin can only withdraw fees - active raffle pools are untouchable.
 *
 * Contract function: withdrawFees(address recipient, uint256 amount)
 *
 * @param recipient Address to receive the fees
 * @param amount Amount to withdraw in USDC (smallest unit, 6 decimals)
 * @param chainId Chain ID
 * @returns Transaction hash and amount withdrawn
 * @throws ContractWriteError if withdrawal fails
 *
 * @example
 * // Withdraw $100 USDC
 * await withdrawProtocolFees('0x...', BigInt(100_000_000), 137)
 */
export async function withdrawProtocolFees(
  recipient: string,
  amount: bigint,
  chainId: number = 137
): Promise<{ transactionHash: string; amount: bigint }> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('withdrawFees', 'No wallet connected');
    }

    // Execute withdrawal
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'withdrawFees',
      args: [recipient as `0x${string}`, amount],
    });

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('withdrawFees', 'Transaction failed');
    }

    // Parse FeesWithdrawn event to get actual amount
    const feeLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'FeesWithdrawn';
      } catch {
        return false;
      }
    });

    let withdrawnAmount = amount; // Default to requested amount
    if (feeLog) {
      const decoded = decodeEventLog({
        abi: FAIRWIN_ABI,
        data: feeLog.data,
        topics: feeLog.topics,
      });
      withdrawnAmount = (decoded.args as any).amount || amount;
    }

    return {
      transactionHash: hash,
      amount: withdrawnAmount,
    };
  } catch (error) {
    throw new ContractWriteError('withdrawFees', (error as Error).message);
  }
}
