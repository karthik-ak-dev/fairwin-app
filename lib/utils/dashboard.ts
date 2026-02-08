// Dashboard Utilities
// Dashboard data aggregation and formatting

import { differenceInMonths } from 'date-fns';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { getStakesByUserId } from '@/lib/db/repositories/stake.repository';
import { getWithdrawalsByUserId } from '@/lib/db/repositories/withdrawal.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import {
  getUserCommissions,
  getCommissionsByLevel,
  getNetworkStructure,
} from '@/lib/utils/referrals';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { constants } from '@/lib/constants';
import { env } from '@/lib/env';

function getMonthsElapsed(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return differenceInMonths(end, start);
}

function isFirstOfMonth(): boolean {
  const today = new Date();
  return today.getDate() === constants.WITHDRAWAL_DAY_OF_MONTH;
}

function getNextFirstOfMonth(): { date: string; daysUntil: number } {
  const today = new Date();
  const currentDay = today.getDate();

  let nextDate: Date;
  if (currentDay === 1) {
    nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (currentDay < 1) {
    nextDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else {
    nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }

  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    date: nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    daysUntil,
  };
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function getDashboardData(userId: string) {
  try {
    const [user, allStakes, allCommissions, completedWithdrawals, stakeConfig, referralConfig] =
      await Promise.all([
        getUserById(userId),
        getStakesByUserId(userId),
        getUserCommissions(userId),
        getWithdrawalsByUserId(userId),
        getStakeConfigById('default'),
        getReferralConfigById('default'),
      ]);

    // Include both ACTIVE and VERIFYING stakes for display
    const activeStakes = allStakes.filter(
      (stake) => stake.status === StakeStatus.ACTIVE || stake.status === StakeStatus.VERIFYING
    );

    if (!user) {
      throw new Error('User not found');
    }

    const [commissionsByLevel, networkStructure] = await Promise.all([
      getCommissionsByLevel(userId),
      getNetworkStructure(userId),
    ]);

    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const activeStakesCount = activeStakes.length;
    const monthlyRate = stakeConfig?.monthlyReturnRate || 0.08;

    const earnedToDate = activeStakes.reduce((sum, stake) => {
      const monthsElapsed = getMonthsElapsed(stake.startDate);
      return sum + stake.amount * monthlyRate * monthsElapsed;
    }, 0);

    const referralEarnings = allCommissions.reduce(
      (sum, commission) => sum + commission.commissionAmount,
      0
    );

    const totalWithdrawn = completedWithdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .reduce((sum, w) => sum + w.amount, 0);

    const availableNow = Math.max(0, earnedToDate + referralEarnings - totalWithdrawn);
    const totalReferrals = networkStructure.reduce((sum, level) => sum + level.uniqueUsers, 0);

    const stakes = activeStakes.map((stake) => {
      const isVerifying = stake.status === StakeStatus.VERIFYING;
      const monthsElapsed = isVerifying ? 0 : getMonthsElapsed(stake.startDate);
      const totalMonths = stakeConfig?.durationMonths || 24;
      const monthlyEarning = stake.amount * monthlyRate;
      const dailyEarning = monthlyEarning / 30;
      const totalEarned = isVerifying ? 0 : monthlyEarning * monthsElapsed;
      const nextReward = getNextFirstOfMonth();

      return {
        id: stake.stakeId,
        amount: stake.amount,
        startDate: stake.startDate ? formatDateShort(stake.startDate) : 'Pending',
        monthsElapsed,
        totalMonths,
        dailyEarning: Math.round(dailyEarning * 100) / 100,
        monthlyEarning: Math.round(monthlyEarning * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        nextRewardDate: isVerifying ? 'Verifying...' : nextReward.date,
        status: isVerifying ? 'Verifying' : 'Active',
        txHash: stake.txHash,
      };
    });

    const commissionRates = referralConfig?.commissionRates || [0.08, 0.03, 0.02, 0.01, 0.01];

    const levels = commissionsByLevel.map((levelData) => ({
      level: levelData.level,
      count: levelData.count,
      rate: (commissionRates[levelData.level - 1] || 0) * 100,
      earnings: Math.round(levelData.totalEarnings * 100) / 100,
    }));

    const allLevels = [];
    for (let i = 1; i <= 5; i++) {
      const existingLevel = levels.find((l) => l.level === i);
      if (existingLevel) {
        allLevels.push(existingLevel);
      } else {
        allLevels.push({
          level: i,
          count: 0,
          rate: (commissionRates[i - 1] || 0) * 100,
          earnings: 0,
        });
      }
    }

    const nextWithdrawal = getNextFirstOfMonth();
    const isWithdrawalAvailable = isFirstOfMonth();

    const stakeRewards = activeStakes.map((stake) => {
      const monthlyReward = stake.amount * monthlyRate;
      return {
        stakeId: stake.stakeId,
        amount: stake.amount,
        reward: Math.round(monthlyReward * 100) / 100,
      };
    });

    const totalStakeRewards = stakeRewards.reduce((sum, sr) => sum + sr.reward, 0);

    const withdrawalHistory = completedWithdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      })
      .map((w) => ({
        id: w.withdrawalId,
        date: formatDateShort(w.completedAt || w.createdAt),
        source: 'All Sources',
        sourceDetail: 'Stake Rewards + Referral Commissions',
        amount: w.amount,
        txHash: w.txHash,
        status: 'Completed',
      }));

    const referralLink = `${env.NEXT_PUBLIC_BASE_URL}/ref/${user.referralCode}`;

    return {
      stats: {
        totalStaked: Math.round(totalStaked * 100) / 100,
        earnedToDate: Math.round(earnedToDate * 100) / 100,
        referralEarnings: Math.round(referralEarnings * 100) / 100,
        availableNow: Math.round(availableNow * 100) / 100,
        activeStakesCount,
        totalReferrals,
      },
      stakes,
      referrals: {
        totalEarnings: Math.round(referralEarnings * 100) / 100,
        levels: allLevels,
      },
      withdrawal: {
        availableAmount: Math.round(availableNow * 100) / 100,
        nextWithdrawalDate: nextWithdrawal.date,
        daysUntilWithdrawal: isWithdrawalAvailable ? 0 : nextWithdrawal.daysUntil,
        isWithdrawalAvailable,
        breakdown: {
          referralCommissions: Math.round(referralEarnings * 100) / 100,
          stakeRewards,
          totalStakeRewards: Math.round(totalStakeRewards * 100) / 100,
        },
      },
      withdrawalHistory,
      referralLink,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}
