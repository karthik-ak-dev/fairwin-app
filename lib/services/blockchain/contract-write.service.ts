/**
 * Contract Write Service
 *
 * Handles writing transactions to the FairWin smart contract.
 * Provides typed wrappers around contract write operations.
 */

'use client';

import { getWalletClient, getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { decodeEventLog } from 'viem';
import { config } from '@/lib/wagmi/config';
import { FAIRWIN_ABI, ERC20_ABI, getContractAddress } from '@/lib/blockchain';
import type {
  RequestRandomnessResult,
  PayoutTransaction,
} from '../types';
import { ContractWriteError, InsufficientFundsError } from '../errors';

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
 * Submit winner payout transaction
 *
 * @throws ContractWriteError if payout fails
 * @throws InsufficientFundsError if insufficient USDC balance
 */
export async function submitPayout(
  raffleId: string,
  winnerAddress: string,
  amount: bigint,
  chainId: number = 137
): Promise<PayoutTransaction> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('payWinner', 'No wallet connected');
    }

    // Estimate gas
    const gas = await publicClient.estimateContractGas({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'payWinner',
      args: [raffleId, winnerAddress, amount],
      account: walletClient.account,
    });

    // Execute transaction
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'payWinner',
      args: [raffleId, winnerAddress, amount],
      gas: gas + BigInt(10000), // Add buffer
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('payWinner', 'Transaction failed');
    }

    return {
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      amount,
      recipient: winnerAddress,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('insufficient')) {
      throw new InsufficientFundsError('USDC', 'unknown');
    }

    throw new ContractWriteError(
      'payWinner',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Estimate gas for a transaction
 *
 * @throws ContractWriteError if estimation fails
 */
export async function estimateGas(
  operation: string,
  params: unknown[],
  chainId: number = 137
): Promise<bigint> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('estimateGas', 'No wallet connected');
    }

    const gas = await publicClient.estimateContractGas({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: operation,
      args: params,
      account: walletClient.account,
    });

    return gas;
  } catch (error) {
    throw new ContractWriteError(
      'estimateGas',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
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
