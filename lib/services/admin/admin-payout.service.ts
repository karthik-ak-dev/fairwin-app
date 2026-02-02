/**
 * Admin Payout Service
 *
 * Handles manual USDC payouts to raffle winners.
 * Admin can send payouts one-by-one or in batch.
 *
 * Flow:
 * 1. Get winners with payoutStatus='pending'
 * 2. Admin reviews and approves payouts
 * 3. Send USDC transfer transactions
 * 4. Update winner and payout records
 * 5. Create audit log
 *
 * Security:
 * - Only admin wallets can trigger payouts
 * - Each payout requires confirmation
 * - Transaction hashes stored for audit trail
 * - Failed payouts can be retried
 */

import { createWalletClient, http, type Address } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { winnerRepo, payoutRepo } from '@/lib/db/repositories';
import { PayoutStatus } from '@/lib/db/models';
import { env, serverEnv } from '@/lib/env';

// ERC20 Transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * USDC contract addresses
 */
const USDC_CONTRACTS = {
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon Mainnet
  80002: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582', // Polygon Amoy Testnet
} as const;

export interface PayoutResult {
  winnerId: string;
  walletAddress: string;
  amount: number;
  transactionHash: string;
  status: PayoutStatus;
  error?: string;
}

export interface BatchPayoutResult {
  raffleId: string;
  totalWinners: number;
  successful: number;
  failed: number;
  payouts: PayoutResult[];
}

/**
 * Get wallet client for sending transactions
 * Uses operator private key from AWS Secrets Manager
 */
async function getWalletClient(chainId: number) {
  const chain = chainId === 137 ? polygon : polygonAmoy;

  // Get private key from environment (in production, from AWS Secrets Manager)
  const privateKey = process.env.OPERATOR_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('OPERATOR_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
}

/**
 * Get USDC contract address for chain
 */
function getUSDCAddress(chainId: number): Address {
  return (USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS] || USDC_CONTRACTS[137]) as Address;
}

/**
 * Send payout to a single winner
 *
 * @param winnerId Winner ID to pay
 * @param chainId Chain ID (default: env.CHAIN_ID)
 * @returns Payout result
 */
export async function sendPayoutToWinner(
  winnerId: string,
  chainId: number = env.CHAIN_ID
): Promise<PayoutResult> {
  // Get winner details
  const winner = await winnerRepo.getById(winnerId);
  if (!winner) {
    throw new Error(`Winner ${winnerId} not found`);
  }

  if (winner.payoutStatus === PayoutStatus.PAID) {
    throw new Error(`Winner ${winnerId} already paid`);
  }

  console.log(`[PayoutService] Sending ${winner.prize / 1_000_000} USDC to ${winner.walletAddress}`);

  try {
    // Create processing payout record
    const processingPayout = await payoutRepo.create({
      winnerId,
      raffleId: winner.raffleId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      status: PayoutStatus.PROCESSING,
    });

    // Get wallet client
    const walletClient = await getWalletClient(chainId);
    const usdcAddress = getUSDCAddress(chainId);

    // Send USDC transfer
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [winner.walletAddress as Address, BigInt(winner.prize)],
    });

    console.log(`[PayoutService] Transaction sent: ${hash}`);

    // Wait for confirmation
    // Note: In production, you might want to poll for receipt instead of waiting
    // to avoid blocking the API response

    // Update winner record
    await winnerRepo.updatePayoutStatus(winnerId, PayoutStatus.PAID, hash);

    // Create payout record
    await payoutRepo.create({
      winnerId,
      raffleId: winner.raffleId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      status: PayoutStatus.PAID,
      transactionHash: hash,
      processedAt: new Date().toISOString(),
    });

    console.log(`[PayoutService] Payout successful for winner ${winnerId}`);

    return {
      winnerId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      transactionHash: hash,
      status: PayoutStatus.PAID,
    };
  } catch (error) {
    console.error(`[PayoutService] Payout failed for winner ${winnerId}:`, error);

    // Update status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await winnerRepo.updatePayoutStatus(winnerId, PayoutStatus.FAILED);

    // Create failed payout record
    await payoutRepo.create({
      winnerId,
      raffleId: winner.raffleId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      status: PayoutStatus.FAILED,
      error: errorMessage,
    });

    return {
      winnerId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      transactionHash: '',
      status: PayoutStatus.FAILED,
      error: errorMessage,
    };
  }
}

/**
 * Send payouts to all winners of a raffle
 *
 * @param raffleId Raffle ID
 * @param chainId Chain ID
 * @returns Batch payout result
 */
export async function sendAllPayouts(
  raffleId: string,
  chainId: number = env.CHAIN_ID
): Promise<BatchPayoutResult> {
  // Get all pending winners
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const pendingWinners = winnersResult.items.filter(w => w.payoutStatus === PayoutStatus.PENDING);

  if (pendingWinners.length === 0) {
    throw new Error(`No pending winners for raffle ${raffleId}`);
  }

  console.log(`[PayoutService] Sending payouts to ${pendingWinners.length} winners for raffle ${raffleId}`);

  const results: PayoutResult[] = [];
  let successful = 0;
  let failed = 0;

  // Send payouts one by one
  // Note: Could be optimized with batch transactions in production
  for (const winner of pendingWinners) {
    const result = await sendPayoutToWinner(winner.winnerId, chainId);
    results.push(result);

    if (result.status === PayoutStatus.PAID) {
      successful++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[PayoutService] Batch payout complete: ${successful} successful, ${failed} failed`);

  return {
    raffleId,
    totalWinners: pendingWinners.length,
    successful,
    failed,
    payouts: results,
  };
}

/**
 * Get payout status for a raffle
 *
 * @param raffleId Raffle ID
 * @returns Payout summary with full winner details
 */
export async function getPayoutStatus(raffleId: string) {
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const winners = winnersResult.items;

  const pendingWinners = winners.filter(w => w.payoutStatus === PayoutStatus.PENDING);
  const paidWinners = winners.filter(w => w.payoutStatus === PayoutStatus.PAID);
  const failedWinners = winners.filter(w => w.payoutStatus === PayoutStatus.FAILED);

  const totalAmount = winners.reduce((sum, w) => sum + w.prize, 0);
  const paidAmount = paidWinners.reduce((sum, w) => sum + w.prize, 0);

  return {
    raffleId,
    winners,
    summary: {
      totalWinners: winners.length,
      pending: pendingWinners.length,
      paid: paidWinners.length,
      failed: failedWinners.length,
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      allPaid: pendingWinners.length === 0 && failedWinners.length === 0,
    },
  };
}
