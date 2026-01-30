/**
 * Raffle Payout Service
 *
 * Handles winner payout processing and transaction management.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { payoutRepo } from '@/lib/db/repositories';
import { statsRepo } from '@/lib/db/repositories';
import type { PayoutResult, PayoutStatus } from '../types';
import {
  RaffleNotFoundError,
  WinnerNotFoundError,
  PayoutNotFoundError,
  PayoutAlreadyProcessedError,
  PayoutFailedError,
} from '../errors';
import * as contractWriteService from '../blockchain/contract-write.service';

/**
 * Process payouts for all winners of a raffle
 *
 * Flow:
 * 1. Get all winners for raffle
 * 2. For each winner:
 *    - Create payout record (pending)
 *    - Submit blockchain transaction
 *    - Update payout status (paid/failed)
 * 3. Update platform stats
 *
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws InsufficientFundsError if contract has insufficient USDC
 */
export async function processRafflePayouts(
  raffleId: string,
  chainId: number = 137
): Promise<PayoutResult[]> {
  // Verify raffle exists and is completed
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  if (raffle.status !== 'completed') {
    throw new PayoutFailedError(
      raffleId,
      `Raffle must be completed (current status: ${raffle.status})`
    );
  }

  // Get all winners
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const winners = winnersResult.items;

  if (winners.length === 0) {
    return [];
  }

  // Process each winner's payout
  const results: PayoutResult[] = [];

  for (const winner of winners) {
    try {
      // Check if payout already exists
      const existing = await payoutRepo.getByWinner(winner.winnerId);
      if (existing.items.length > 0) {
        const payout = existing.items[0];
        if (payout.status === 'paid') {
          throw new PayoutAlreadyProcessedError(payout.payoutId, payout.status);
        }
        // If pending or failed, we can retry
      }

      // Create payout record
      const payout = await payoutRepo.create({
        winnerId: winner.winnerId,
        raffleId,
        walletAddress: winner.walletAddress,
        amount: winner.prize,
      });

      try {
        // Submit blockchain transaction
        const result = await contractWriteService.submitPayout(
          raffleId,
          winner.walletAddress,
          BigInt(winner.prize),
          chainId
        );

        // Mark as paid
        await payoutRepo.updateStatus(payout.payoutId, 'paid', result.transactionHash);

        // Update platform stats
        await statsRepo.incrementWinnerStats(winner.prize);

        results.push({
          winnerId: winner.winnerId,
          payoutId: payout.payoutId,
          walletAddress: winner.walletAddress,
          amount: winner.prize,
          status: 'paid',
          transactionHash: result.transactionHash,
          timestamp: Date.now(),
        });
      } catch (txError) {
        // Mark as failed
        const errorMsg = txError instanceof Error ? txError.message : 'Transaction failed';
        await payoutRepo.updateStatus(payout.payoutId, 'failed', undefined, errorMsg);

        results.push({
          winnerId: winner.winnerId,
          payoutId: payout.payoutId,
          walletAddress: winner.walletAddress,
          amount: winner.prize,
          status: 'failed',
          error: txError instanceof Error ? txError.message : 'Transaction failed',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      results.push({
        winnerId: winner.winnerId,
        payoutId: '',
        walletAddress: winner.walletAddress,
        amount: winner.prize,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payout processing failed',
        timestamp: Date.now(),
      });
    }
  }

  return results;
}

/**
 * Retry a failed payout
 *
 * @throws PayoutNotFoundError if payout doesn't exist
 * @throws PayoutAlreadyProcessedError if payout is already paid
 */
export async function retryPayout(
  payoutId: string,
  chainId: number = 137
): Promise<PayoutResult> {
  const payout = await payoutRepo.getById(payoutId);
  if (!payout) {
    throw new PayoutNotFoundError(payoutId);
  }

  if (payout.status === 'paid') {
    throw new PayoutAlreadyProcessedError(payout.payoutId, payout.status);
  }

  // Get winner details
  const winner = await winnerRepo.getById(payout.winnerId);
  if (!winner) {
    throw new WinnerNotFoundError(payout.winnerId);
  }

  try {
    // Update to pending
    await payoutRepo.updateStatus(payoutId, 'pending');

    // Submit blockchain transaction
    const result = await contractWriteService.submitPayout(
      winner.raffleId,
      winner.walletAddress,
      BigInt(payout.amount),
      chainId
    );

    // Mark as paid
    await payoutRepo.updateStatus(payoutId, 'paid', result.transactionHash);

    // Update platform stats
    await statsRepo.incrementWinnerStats(payout.amount);

    return {
      winnerId: winner.winnerId,
      payoutId,
      walletAddress: winner.walletAddress,
      amount: payout.amount,
      status: 'paid',
      transactionHash: result.transactionHash,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Mark as failed again
    const errorMsg = error instanceof Error ? error.message : 'Transaction failed';
    await payoutRepo.updateStatus(payoutId, 'failed', undefined, errorMsg);

    return {
      winnerId: winner.winnerId,
      payoutId,
      walletAddress: winner.walletAddress,
      amount: payout.amount,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Transaction failed',
      timestamp: Date.now(),
    };
  }
}

/**
 * Get payout status for a raffle
 */
export async function getPayoutStatus(raffleId: string): Promise<PayoutStatus> {
  const winnersResult = await winnerRepo.getByRaffle(raffleId);
  const winners = winnersResult.items;

  if (winners.length === 0) {
    return {
      raffleId,
      totalWinners: 0,
      payoutsSummary: {
        pending: 0,
        paid: 0,
        failed: 0,
        totalAmount: 0,
        paidAmount: 0,
      },
      payouts: [],
    };
  }

  // Get payouts for all winners
  const payouts = await Promise.all(
    winners.map((w) => payoutRepo.getByWinner(w.winnerId))
  );

  const flatPayouts = payouts.flatMap((p) => p.items);

  const pending = flatPayouts.filter((p) => p.status === 'pending').length;
  const paid = flatPayouts.filter((p) => p.status === 'paid').length;
  const failed = flatPayouts.filter((p) => p.status === 'failed').length;

  const totalAmount = winners.reduce((sum, w) => sum + w.prize, 0);
  const paidAmount = flatPayouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    raffleId,
    totalWinners: winners.length,
    payoutsSummary: {
      pending,
      paid,
      failed,
      totalAmount,
      paidAmount,
    },
    payouts: flatPayouts,
  };
}

/**
 * Get all pending payouts
 */
export async function getPendingPayouts() {
  const result = await payoutRepo.getByStatus('pending');
  return result.items;
}

/**
 * Get all failed payouts
 */
export async function getFailedPayouts() {
  const result = await payoutRepo.getByStatus('failed');
  return result.items;
}
