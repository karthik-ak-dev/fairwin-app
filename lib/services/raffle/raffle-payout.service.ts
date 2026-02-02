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
import { winnerRepo, payoutRepo, entryRepo, userRepo } from '@/lib/db/repositories';
import { PayoutStatus, EntryStatus } from '@/lib/db/models';
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

export interface RefundResult {
  entryId: string;
  walletAddress: string;
  amount: number;
  transactionHash: string;
  status: EntryStatus;
  error?: string;
}

export interface BatchRefundResult {
  raffleId: string;
  totalEntries: number;
  successful: number;
  failed: number;
  refunds: RefundResult[];
}

/**
 * Send refund for a single entry
 *
 * @param entryId Entry ID to refund
 * @param chainId Chain ID (default: env.CHAIN_ID)
 * @returns Refund result
 */
export async function sendRefundForEntry(
  entryId: string,
  chainId: number = env.CHAIN_ID
): Promise<RefundResult> {
  // Get entry details
  const entry = await entryRepo.getById(entryId);
  if (!entry) {
    throw new Error(`Entry ${entryId} not found`);
  }

  if (entry.status === EntryStatus.REFUNDED) {
    throw new Error(`Entry ${entryId} already refunded`);
  }

  if (entry.status !== EntryStatus.CONFIRMED && entry.status !== EntryStatus.REFUND_PENDING && entry.status !== EntryStatus.REFUND_FAILED) {
    throw new Error(`Entry ${entryId} cannot be refunded (status: ${entry.status})`);
  }

  console.log(`[PayoutService] Refunding ${entry.totalPaid / 1_000_000} USDC to ${entry.walletAddress}`);

  try {
    // Update status to refund processing
    await entryRepo.updateStatus(entryId, EntryStatus.REFUND_PROCESSING);

    // Get wallet client
    const walletClient = getWalletClient(chainId);
    const usdcAddress = getUSDCAddress(chainId);

    // Send USDC refund
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [entry.walletAddress as Address, BigInt(entry.totalPaid)],
    });

    console.log(`[PayoutService] Refund transaction sent: ${hash}`);

    // Update entry to refunded with transaction hash
    await entryRepo.update(entryId, {
      status: EntryStatus.REFUNDED,
      refundTransactionHash: hash,
      updatedAt: new Date().toISOString(),
    });

    // Update user stats (decrement activeEntries, totalSpent)
    await userRepo.processRefund(entry.walletAddress, entry.numEntries, entry.totalPaid);

    console.log(`[PayoutService] Refund successful for entry ${entryId}`);

    return {
      entryId,
      walletAddress: entry.walletAddress,
      amount: entry.totalPaid,
      transactionHash: hash,
      status: EntryStatus.REFUNDED,
    };
  } catch (error) {
    console.error(`[PayoutService] Refund failed for entry ${entryId}:`, error);

    // Update status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await entryRepo.updateStatus(entryId, EntryStatus.REFUND_FAILED);

    return {
      entryId,
      walletAddress: entry.walletAddress,
      amount: entry.totalPaid,
      transactionHash: '',
      status: EntryStatus.REFUND_FAILED,
      error: errorMessage,
    };
  }
}

/**
 * Process raffle cancellation with USDC refunds
 *
 * Called by cancelRaffle in raffle-management.service.
 *
 * Flow:
 * 1. Mark all entries as REFUND_PENDING
 * 2. Send USDC refunds to all users (parallel)
 * 3. Update entry status to REFUNDED on success
 * 4. Update user stats after successful refund
 *
 * Note: Does NOT update raffle status - caller is responsible for that.
 *
 * @param raffleId Raffle to process cancellation for
 * @param chainId Chain ID for refunds
 * @returns Batch refund result
 */
export async function processRaffleCancellation(
  raffleId: string,
  chainId: number = env.CHAIN_ID
): Promise<BatchRefundResult> {
  // 1. Get all confirmed entries
  const allEntries = await entryRepo.getByRaffleId(raffleId);
  const confirmedEntries = allEntries.filter(e => e.status === EntryStatus.CONFIRMED);

  if (confirmedEntries.length === 0) {
    console.log(`[PayoutService] No entries to refund for raffle ${raffleId}`);
    return {
      raffleId,
      totalEntries: 0,
      successful: 0,
      failed: 0,
      refunds: [],
    };
  }

  console.log(`[PayoutService] Processing refunds for ${confirmedEntries.length} entries in raffle ${raffleId}`);

  // 2. Mark all entries as refund pending
  const entryIds = confirmedEntries.map((e) => e.entryId);
  await entryRepo.batchUpdateStatus(entryIds, EntryStatus.REFUND_PENDING);

  // 3. Send all refunds in parallel using Promise.allSettled
  // This allows independent transactions to execute concurrently
  // Failed refunds won't block successful ones
  const refundPromises = confirmedEntries.map(entry =>
    sendRefundForEntry(entry.entryId, chainId)
  );

  const settledResults = await Promise.allSettled(refundPromises);

  // 4. Process results
  const results: RefundResult[] = [];
  let successful = 0;
  let failed = 0;

  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
      if (result.value.status === EntryStatus.REFUNDED) {
        successful++;
      } else {
        failed++;
      }
    } else {
      // Promise rejected - create a failed result
      failed++;
      console.error('[PayoutService] Refund promise rejected:', result.reason);
    }
  });

  console.log(`[PayoutService] Batch refund complete: ${successful} successful, ${failed} failed`);

  return {
    raffleId,
    totalEntries: confirmedEntries.length,
    successful,
    failed,
    refunds: results,
  };
}

/**
 * Get refund status for a raffle
 *
 * @param raffleId Raffle ID
 * @returns Refund summary
 */
export async function getRefundStatus(raffleId: string) {
  const allEntries = await entryRepo.getByRaffleId(raffleId);

  const pending = allEntries.filter(e => e.status === EntryStatus.REFUND_PENDING);
  const processing = allEntries.filter(e => e.status === EntryStatus.REFUND_PROCESSING);
  const refunded = allEntries.filter(e => e.status === EntryStatus.REFUNDED);
  const failed = allEntries.filter(e => e.status === EntryStatus.REFUND_FAILED);

  const totalAmount = allEntries.reduce((sum, e) => sum + e.totalPaid, 0);
  const refundedAmount = refunded.reduce((sum, e) => sum + e.totalPaid, 0);

  return {
    raffleId,
    entries: allEntries,
    summary: {
      totalEntries: allEntries.length,
      pending: pending.length,
      processing: processing.length,
      refunded: refunded.length,
      failed: failed.length,
      totalAmount,
      refundedAmount,
      remainingAmount: totalAmount - refundedAmount,
      allRefunded: pending.length === 0 && processing.length === 0 && failed.length === 0,
    },
  };
}
