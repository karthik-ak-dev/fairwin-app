// Withdrawal Service - Business logic for withdrawal calculations
// Responsibilities:
// - Calculate available balance for withdrawals (stake rewards + referral commissions)

import { getStakesByUserId } from '@/lib/db/repositories/stake.repository';
import { getReferralsByReferrerId } from '@/lib/db/repositories/referral.repository';
import { getWithdrawalsByUserId } from '@/lib/db/repositories/withdrawal.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { constants } from '@/lib/constants';

/**
 * Calculate available balance for withdrawal
 * Balance = Total stake rewards earned + Total referral commissions - Total withdrawn
 */
export async function calculateAvailableBalance(userId: string): Promise<number> {
  try {
    // Get all user stakes
    const stakes = await getStakesByUserId(userId);

    // Get all referral commissions earned
    const commissions = await getReferralsByReferrerId(userId);

    // Get all withdrawals
    const withdrawals = await getWithdrawalsByUserId(userId);

    // Get stake config for reward calculation
    const stakeConfig = await getStakeConfigById(constants.DEFAULT_STAKE_CONFIG_ID);
    if (!stakeConfig) {
      throw new Error('Stake configuration not found');
    }

    // Calculate total rewards from ACTIVE and COMPLETED stakes
    let totalStakeRewards = 0;
    for (const stake of stakes) {
      if (stake.status === StakeStatus.ACTIVE || stake.status === StakeStatus.COMPLETED) {
        // Calculate months elapsed
        const startDate = new Date(stake.startDate);
        const now = new Date();
        const endDate = stake.endDate ? new Date(stake.endDate) : now;

        const actualEndDate = endDate < now ? endDate : now;
        const monthsElapsed = Math.floor(
          (actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        // Monthly reward = stake amount * monthly rate
        const monthlyReward = stake.amount * stakeConfig.monthlyReturnRate;
        totalStakeRewards += monthlyReward * monthsElapsed;
      }
    }

    // Calculate total referral commissions
    const totalCommissions = commissions.reduce(
      (sum, commission) => sum + commission.commissionAmount,
      0
    );

    // Calculate total withdrawn (only COMPLETED withdrawals)
    const totalWithdrawn = withdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .reduce((sum, w) => sum + w.amount, 0);

    // Available balance = rewards + commissions - withdrawn
    const availableBalance = totalStakeRewards + totalCommissions - totalWithdrawn;

    return Math.max(0, availableBalance); // Never negative
  } catch (error) {
    console.error('Error calculating available balance:', error);
    throw error;
  }
}
