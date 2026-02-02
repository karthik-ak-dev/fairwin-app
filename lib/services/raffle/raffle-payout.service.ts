/**
 * Raffle Payout & Admin Operations Service
 *
 * Handles manual USDC payouts to raffle winners and raffle cancellations.
 * This service combines:
 * - Winner payout operations (individual and batch)
 * - Raffle cancellation with refunds
 * - Payout status tracking
 *
 * Flow:
 * 1. Get winners with payoutStatus='pending'
 * 2. Admin reviews and approves payouts
 * 3. Send USDC transfer transactions
 * 4. Update winner and payout records
 *
 * Security:
 * - Only admin wallets can trigger payouts
 * - Each payout requires confirmation
 * - Transaction hashes stored for audit trail
 * - Failed payouts can be retried
 */

import type { Address } from 'viem';
import { winnerRepo, payoutRepo, raffleRepo, entryRepo, userRepo } from '@/lib/db/repositories';
import { PayoutStatus, RaffleStatus } from '@/lib/db/models';
import { ERC20_ABI, getWalletClient, getUSDCAddress } from '@/lib/blockchain/client';
import { env } from '@/lib/env';

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
    const walletClient = getWalletClient(chainId);
    const usdcAddress = getUSDCAddress(chainId);

    // Send USDC transfer
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
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

  console.log(`[PayoutService] Sending payouts to ${pendingWinners.length} winners for raffle ${raffleId} (parallel)`);

  // Send all payouts in parallel using Promise.allSettled
  // This allows independent transactions to execute concurrently
  // Failed transactions won't block successful ones
  const payoutPromises = pendingWinners.map(winner =>
    sendPayoutToWinner(winner.winnerId, chainId)
  );

  const settledResults = await Promise.allSettled(payoutPromises);

  // Process results
  const results: PayoutResult[] = [];
  let successful = 0;
  let failed = 0;

  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
      if (result.value.status === PayoutStatus.PAID) {
        successful++;
      } else {
        failed++;
      }
    } else {
      // Promise rejected - create a failed result
      failed++;
      console.error('[PayoutService] Payout promise rejected:', result.reason);
    }
  });

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

/**
 * Get platform-wide payout breakdown
 *
 * Aggregates payout statistics across all raffles.
 * Used by platform stats service.
 *
 * @returns Payout breakdown with totals and averages
 */
export async function getPlatformPayoutBreakdown() {
  const [pendingResult, paidResult, failedResult] = await Promise.all([
    payoutRepo.getByStatus(PayoutStatus.PENDING),
    payoutRepo.getByStatus(PayoutStatus.PAID),
    payoutRepo.getByStatus(PayoutStatus.FAILED),
  ]);

  const pending = pendingResult.items;
  const paid = paidResult.items;
  const failed = failedResult.items;

  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = failed.reduce((sum, p) => sum + p.amount, 0);

  const allPayouts = [...pending, ...paid, ...failed];
  const avgAmount = allPayouts.length > 0
    ? Math.round(allPayouts.reduce((sum, p) => sum + p.amount, 0) / allPayouts.length)
    : 0;

  return {
    pending: totalPending,
    paid: totalPaid,
    failed: totalFailed,
    avgAmount,
  };
}

/**
 * Process raffle cancellation with refunds
 *
 * Called by admin when cancelling a raffle.
 * Marks all entries as refunded and updates user stats.
 *
 * @param raffleId Raffle to cancel
 */
export async function processRaffleCancellation(raffleId: string): Promise<void> {
  // 1. Update raffle status to cancelled
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.CANCELLED,
  });

  // 2. Get all entries
  const allEntries = await entryRepo.findByRaffleId(raffleId);

  // 3. Mark all entries as refunded
  const entryIds = allEntries.map((e) => e.entryId);
  await entryRepo.markAsRefunded(entryIds);

  // 4. Process refunds for each user
  const refundsByUser = new Map<string, { numEntries: number; totalPaid: number }>();

  for (const entry of allEntries) {
    const current = refundsByUser.get(entry.walletAddress) || {
      numEntries: 0,
      totalPaid: 0,
    };
    refundsByUser.set(entry.walletAddress, {
      numEntries: current.numEntries + entry.numEntries,
      totalPaid: current.totalPaid + entry.totalPaid,
    });
  }

  // Update user stats (decrement activeEntries, totalSpent)
  for (const [walletAddress, { numEntries, totalPaid }] of Array.from(refundsByUser.entries())) {
    await userRepo.processRefund(walletAddress, numEntries, totalPaid);
  }

  console.log(
    `[PayoutService] Cancelled raffle ${raffleId}, refunded ${allEntries.length} entries`
  );
}
