// Withdrawal Query Service
// Responsibilities:
// - Query withdrawals with various filters
// - Calculate withdrawal statistics and summaries
// - Admin queries for withdrawal management

import {
  getWithdrawalById,
  getWithdrawalsByUserId,
  getWithdrawalsByStatus,
  getUserWithdrawalsByStatus,
} from '@/lib/db/repositories/withdrawal.repository';
import { Withdrawal, WithdrawalStatus } from '@/lib/db/models/withdrawal.model';

/**
 * Get a single withdrawal by ID
 */
export async function getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
  return await getWithdrawalById(withdrawalId);
}

/**
 * Get all withdrawals for a user (sorted by date)
 */
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  return await getWithdrawalsByUserId(userId);
}

/**
 * Get user's withdrawals by status
 */
export async function getUserWithdrawalsByStatusQuery(
  userId: string,
  status: WithdrawalStatus
): Promise<Withdrawal[]> {
  return await getUserWithdrawalsByStatus(userId, status);
}

/**
 * Get all withdrawals by status (admin use)
 */
export async function getWithdrawalsByStatusQuery(status: WithdrawalStatus): Promise<Withdrawal[]> {
  return await getWithdrawalsByStatus(status);
}

/**
 * Get user's withdrawal summary
 * Returns statistics about user's withdrawals
 */
export async function getUserWithdrawalSummary(userId: string): Promise<{
  totalWithdrawn: number;
  pendingAmount: number;
  processingAmount: number;
  completedWithdrawals: number;
  failedWithdrawals: number;
  lastWithdrawalDate: string | null;
}> {
  const withdrawals = await getWithdrawalsByUserId(userId);

  const summary = {
    totalWithdrawn: 0,
    pendingAmount: 0,
    processingAmount: 0,
    completedWithdrawals: 0,
    failedWithdrawals: 0,
    lastWithdrawalDate: null as string | null,
  };

  for (const withdrawal of withdrawals) {
    if (withdrawal.status === WithdrawalStatus.COMPLETED) {
      summary.totalWithdrawn += withdrawal.amount;
      summary.completedWithdrawals += 1;

      // Update last withdrawal date
      if (!summary.lastWithdrawalDate || withdrawal.completedAt! > summary.lastWithdrawalDate) {
        summary.lastWithdrawalDate = withdrawal.completedAt!;
      }
    } else if (withdrawal.status === WithdrawalStatus.PENDING) {
      summary.pendingAmount += withdrawal.amount;
    } else if (withdrawal.status === WithdrawalStatus.PROCESSING) {
      summary.processingAmount += withdrawal.amount;
    } else if (withdrawal.status === WithdrawalStatus.FAILED) {
      summary.failedWithdrawals += 1;
    }
  }

  return summary;
}
