// Withdrawal Utilities
// Withdrawal creation, validation, and balance calculations

import { differenceInMonths } from 'date-fns';
import {
  createWithdrawal,
  getWithdrawalById,
  getWithdrawalsByStatus,
  updateWithdrawalStatus,
  updateWithdrawalTxHash,
  getWithdrawalsByUserId,
} from '@/lib/db/repositories/withdrawal.repository';
import { getStakesByUserId } from '@/lib/db/repositories/stake.repository';
import { getReferralsByReferrerId } from '@/lib/db/repositories/referral.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { Withdrawal, WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { constants } from '@/lib/constants';

/**
 * Calculate available balance for withdrawal
 */
export async function calculateAvailableBalance(userId: string): Promise<number> {
  try {
    const stakes = await getStakesByUserId(userId);
    const commissions = await getReferralsByReferrerId(userId);
    const withdrawals = await getWithdrawalsByUserId(userId);

    const stakeConfig = await getStakeConfigById(constants.DEFAULT_STAKE_CONFIG_ID);
    if (!stakeConfig) {
      throw new Error('Stake configuration not found');
    }

    let totalStakeRewards = 0;
    for (const stake of stakes) {
      if (stake.status === StakeStatus.ACTIVE || stake.status === StakeStatus.COMPLETED) {
        const startDate = new Date(stake.startDate);
        const now = new Date();
        const endDate = stake.endDate ? new Date(stake.endDate) : now;

        const actualEndDate = endDate < now ? endDate : now;
        const monthsElapsed = differenceInMonths(actualEndDate, startDate);

        const monthlyReward = stake.amount * stakeConfig.monthlyReturnRate;
        totalStakeRewards += monthlyReward * monthsElapsed;
      }
    }

    const totalCommissions = commissions.reduce(
      (sum, commission) => sum + commission.commissionAmount,
      0
    );

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = totalStakeRewards + totalCommissions - totalWithdrawn;

    return Math.max(0, availableBalance);
  } catch (error) {
    console.error('Error calculating available balance:', error);
    throw error;
  }
}

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
 * Create a withdrawal with validation
 */
export async function createUserWithdrawal(
  userId: string,
  walletAddress: string,
  amount: number
): Promise<{ success: boolean; withdrawal?: Withdrawal; error?: string }> {
  try {
    if (!isWithdrawalDayAllowed()) {
      return {
        success: false,
        error: 'Withdrawals are only allowed on the 1st of each month.',
      };
    }

    const alreadyWithdrawn = await hasWithdrawnThisMonth(userId);
    if (alreadyWithdrawn) {
      return {
        success: false,
        error: 'You have already withdrawn this month. Only one withdrawal per month is allowed.',
      };
    }

    if (!walletAddress || walletAddress.trim() === '') {
      return { success: false, error: 'Wallet address is required' };
    }

    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

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
 */
export async function initiateWithdrawalTransaction(
  withdrawalId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return {
        success: false,
        error: 'Withdrawal must be in PENDING status to initiate transaction',
      };
    }

    await updateWithdrawalTxHash(withdrawalId, txHash);

    return { success: true };
  } catch (error) {
    console.error('Error initiating withdrawal transaction:', error);
    return { success: false, error: 'Failed to initiate withdrawal transaction' };
  }
}

/**
 * Complete a withdrawal
 */
export async function completeWithdrawal(
  withdrawalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    if (withdrawal.status !== WithdrawalStatus.PROCESSING) {
      return {
        success: false,
        error: 'Withdrawal must be in PROCESSING status to complete',
      };
    }

    const now = new Date().toISOString();
    await updateWithdrawalStatus(withdrawalId, WithdrawalStatus.COMPLETED, undefined, now);

    return { success: true };
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    return { success: false, error: 'Failed to complete withdrawal' };
  }
}

/**
 * Mark withdrawal as failed
 */
export async function failWithdrawal(
  withdrawalId: string,
  failureReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: 'Withdrawal not found' };
    }

    if (
      withdrawal.status !== WithdrawalStatus.PENDING &&
      withdrawal.status !== WithdrawalStatus.PROCESSING
    ) {
      return {
        success: false,
        error: 'Withdrawal must be in PENDING or PROCESSING status to mark as failed',
      };
    }

    await updateWithdrawalStatus(withdrawalId, WithdrawalStatus.FAILED, undefined, undefined, failureReason);

    return { success: true };
  } catch (error) {
    console.error('Error marking withdrawal as failed:', error);
    return { success: false, error: 'Failed to mark withdrawal as failed' };
  }
}

/**
 * Get withdrawals by status
 */
export async function getWithdrawalsByStatusHelper(status: WithdrawalStatus): Promise<Withdrawal[]> {
  try {
    return await getWithdrawalsByStatus(status);
  } catch (error) {
    console.error(`Error fetching withdrawals with status ${status}:`, error);
    return [];
  }
}
