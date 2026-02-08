// Withdrawal Entry Service
// Responsibilities:
// - Handle withdrawal creation and lifecycle management
// - Validate withdrawal eligibility (date, amount limits)
// - One simple withdrawal per user per month
// - Update withdrawal status (PENDING → PROCESSING → COMPLETED/FAILED)
// - Process blockchain transaction updates

import {
  createWithdrawal,
  getWithdrawalById,
  getWithdrawalsByStatus,
  updateWithdrawalStatus,
  updateWithdrawalTxHash,
  getWithdrawalsByUserId,
} from '@/lib/db/repositories/withdrawal.repository';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { Withdrawal, WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { constants } from '@/lib/constants';

/**
 * Check if today is a valid withdrawal day (1st of the month)
 */
export function isWithdrawalDayAllowed(): boolean {
  const today = new Date();
  return today.getDate() === constants.WITHDRAWAL_DAY_OF_MONTH;
}

/**
 * Check if user has already withdrawn this month
 */
export async function hasWithdrawnThisMonth(userId: string): Promise<boolean> {
  const withdrawals = await getWithdrawalsByUserId(userId);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Check if any completed or processing withdrawal exists for this month
  return withdrawals.some((withdrawal) => {
    if (
      withdrawal.status !== WithdrawalStatus.COMPLETED &&
      withdrawal.status !== WithdrawalStatus.PROCESSING
    ) {
      return false;
    }

    const requestDate = new Date(withdrawal.requestedAt);
    return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
  });
}

/**
 * Create a withdrawal
 * Simple: one withdrawal per user per month
 */
export async function createUserWithdrawal(
  userId: string,
  walletAddress: string,
  amount: number
): Promise<{ success: boolean; withdrawal?: Withdrawal; error?: string }> {
  try {
    // Validate withdrawal day
    if (!isWithdrawalDayAllowed()) {
      return {
        success: false,
        error: 'Withdrawals are only allowed on the 1st of each month.',
      };
    }

    // Check if user has already withdrawn this month
    const alreadyWithdrawn = await hasWithdrawnThisMonth(userId);
    if (alreadyWithdrawn) {
      return {
        success: false,
        error: 'You have already withdrawn this month. Only one withdrawal per month is allowed.',
      };
    }

    // Validate wallet address
    if (!walletAddress || walletAddress.trim() === '') {
      return { success: false, error: 'Wallet address is required' };
    }

    // Get user to verify they exist
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Validate amount
    if (amount < constants.MIN_WITHDRAWAL_AMOUNT) {
      return {
        success: false,
        error: `Minimum withdrawal amount is ${constants.MIN_WITHDRAWAL_AMOUNT} USDT`,
      };
    }

    if (amount > constants.MAX_WITHDRAWAL_AMOUNT) {
      return {
        success: false,
        error: `Maximum withdrawal amount is ${constants.MAX_WITHDRAWAL_AMOUNT} USDT`,
      };
    }

    if (amount <= 0) {
      return { success: false, error: 'Withdrawal amount must be greater than zero' };
    }

    // Create withdrawal
    const withdrawal = await createWithdrawal({
      userId,
      amount,
      walletAddress,
    });

    return { success: true, withdrawal };
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return { success: false, error: 'Failed to create withdrawal' };
  }
}

/**
 * Initiate blockchain transaction for a withdrawal
 * Updates withdrawal with txHash and moves to PROCESSING status
 */
export async function initiateWithdrawalTransaction(
  withdrawalId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get withdrawal
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    // Validate status
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return {
        success: false,
        error: 'Withdrawal must be in PENDING status to initiate transaction',
      };
    }

    // Update with txHash and move to PROCESSING
    await updateWithdrawalTxHash(withdrawalId, txHash);

    return { success: true };
  } catch (error) {
    console.error('Error initiating withdrawal transaction:', error);
    return { success: false, error: 'Failed to initiate withdrawal transaction' };
  }
}

/**
 * Complete a withdrawal after blockchain confirmation
 * Moves withdrawal from PROCESSING to COMPLETED status
 */
export async function completeWithdrawal(
  withdrawalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get withdrawal
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    // Validate status
    if (withdrawal.status !== WithdrawalStatus.PROCESSING) {
      return {
        success: false,
        error: 'Withdrawal must be in PROCESSING status to complete',
      };
    }

    // Update to COMPLETED
    const now = new Date().toISOString();
    await updateWithdrawalStatus(withdrawalId, WithdrawalStatus.COMPLETED, undefined, now);

    return { success: true };
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    return { success: false, error: 'Failed to complete withdrawal' };
  }
}

/**
 * Mark withdrawal as failed with reason
 * Can fail from PENDING or PROCESSING status
 */
export async function failWithdrawal(
  withdrawalId: string,
  failureReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get withdrawal
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    // Can only fail from PENDING or PROCESSING
    if (
      withdrawal.status !== WithdrawalStatus.PENDING &&
      withdrawal.status !== WithdrawalStatus.PROCESSING
    ) {
      return {
        success: false,
        error: 'Withdrawal must be in PENDING or PROCESSING status to mark as failed',
      };
    }

    // Mark as failed
    await updateWithdrawalStatus(withdrawalId, WithdrawalStatus.FAILED, undefined, undefined, failureReason);

    return { success: true };
  } catch (error) {
    console.error('Error marking withdrawal as failed:', error);
    return { success: false, error: 'Failed to mark withdrawal as failed' };
  }
}

/**
 * Get all withdrawals in PENDING status
 * Used by cron job to process withdrawals
 */
export async function getPendingWithdrawals(): Promise<Withdrawal[]> {
  try {
    return await getWithdrawalsByStatus(WithdrawalStatus.PENDING);
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    return [];
  }
}
