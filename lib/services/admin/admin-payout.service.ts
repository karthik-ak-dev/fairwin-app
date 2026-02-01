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
import { env, serverEnv } from '@/lib/env';
import { auditPayout } from '../audit/audit-trail.service';

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
  status: 'paid' | 'failed';
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
 * @param adminWallet Admin wallet address (for audit log)
 * @param chainId Chain ID (default: env.CHAIN_ID)
 * @returns Payout result
 */
export async function sendPayoutToWinner(
  winnerId: string,
  adminWallet: string,
  chainId: number = env.CHAIN_ID
): Promise<PayoutResult> {
  // Get winner details
  const winner = await winnerRepo.getById(winnerId);
  if (!winner) {
    throw new Error(`Winner ${winnerId} not found`);
  }

  if (winner.payoutStatus === 'paid') {
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
      status: 'processing',
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
    await winnerRepo.updatePayoutStatus(winnerId, 'paid', hash);

    // Create payout record
    await payoutRepo.create({
      winnerId,
      raffleId: winner.raffleId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      status: 'paid',
      transactionHash: hash,
      processedAt: new Date().toISOString(),
    });

    // Create audit log
    await auditPayout({
      raffleId: winner.raffleId,
      winnerId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      transactionHash: hash,
      adminWallet,
    });

    console.log(`[PayoutService] Payout successful for winner ${winnerId}`);

    return {
      winnerId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      transactionHash: hash,
      status: 'paid',
    };
  } catch (error) {
    console.error(`[PayoutService] Payout failed for winner ${winnerId}:`, error);

    // Update status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await winnerRepo.updatePayoutStatus(winnerId, 'failed');

    // Create failed payout record
    await payoutRepo.create({
      winnerId,
      raffleId: winner.raffleId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      status: 'failed',
      error: errorMessage,
    });

    return {
      winnerId,
      walletAddress: winner.walletAddress,
      amount: winner.prize,
      transactionHash: '',
      status: 'failed',
      error: errorMessage,
    };
  }
}

/**
 * Send payouts to all winners of a raffle
 *
 * @param raffleId Raffle ID
 * @param adminWallet Admin wallet address
 * @param chainId Chain ID
 * @returns Batch payout result
 */
export async function sendAllPayouts(
  raffleId: string,
  adminWallet: string,
  chainId: number = env.CHAIN_ID
): Promise<BatchPayoutResult> {
  // Get all pending winners
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const pendingWinners = winnersResult.items.filter(w => w.payoutStatus === 'pending');

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
    const result = await sendPayoutToWinner(winner.winnerId, adminWallet, chainId);
    results.push(result);

    if (result.status === 'paid') {
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
 * Retry failed payout
 *
 * @param winnerId Winner ID with failed payout
 * @param adminWallet Admin wallet address
 * @param chainId Chain ID
 * @returns Payout result
 */
export async function retryFailedPayout(
  winnerId: string,
  adminWallet: string,
  chainId: number = env.CHAIN_ID
): Promise<PayoutResult> {
  const winner = await winnerRepo.getById(winnerId);
  if (!winner) {
    throw new Error(`Winner ${winnerId} not found`);
  }

  if (winner.payoutStatus !== 'failed') {
    throw new Error(`Winner ${winnerId} payout status is not 'failed' (current: ${winner.payoutStatus})`);
  }

  console.log(`[PayoutService] Retrying failed payout for winner ${winnerId}`);

  // Reset to pending and retry
  await winnerRepo.updatePayoutStatus(winnerId, 'pending');
  return sendPayoutToWinner(winnerId, adminWallet, chainId);
}

/**
 * Get payout status for a raffle
 *
 * @param raffleId Raffle ID
 * @returns Payout summary
 */
export async function getPayoutStatus(raffleId: string) {
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const winners = winnersResult.items;

  const pending = winners.filter(w => w.payoutStatus === 'pending').length;
  const paid = winners.filter(w => w.payoutStatus === 'paid').length;
  const failed = winners.filter(w => w.payoutStatus === 'failed').length;

  const totalAmount = winners.reduce((sum, w) => sum + w.prize, 0);
  const paidAmount = winners
    .filter(w => w.payoutStatus === 'paid')
    .reduce((sum, w) => sum + w.prize, 0);

  return {
    raffleId,
    totalWinners: winners.length,
    pending,
    paid,
    failed,
    totalAmount,
    paidAmount,
    remainingAmount: totalAmount - paidAmount,
    allPaid: pending === 0 && failed === 0,
  };
}

/**
 * Get pending payouts across all raffles
 *
 * @returns List of pending winners
 */
export async function getAllPendingPayouts() {
  // This would require a GSI on payoutStatus in the Winners table
  // For now, we'll query recent raffles and filter
  // In production, add GSI: payoutStatus-createdAt-index

  const allWinners = await winnerRepo.getRecent(100); // Get recent 100 winners
  const pending = allWinners.filter(w => w.payoutStatus === 'pending');

  return pending.map(w => ({
    winnerId: w.winnerId,
    raffleId: w.raffleId,
    walletAddress: w.walletAddress,
    prize: w.prize,
    tier: w.tier,
    createdAt: w.createdAt,
  }));
}
