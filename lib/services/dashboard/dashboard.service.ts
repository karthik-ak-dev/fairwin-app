// Dashboard Service
// Responsibilities:
// - Aggregate all dashboard data for authenticated user
// - Calculate stats, stakes progress, referral network, withdrawal info
// - Single API call pattern - fetch everything in parallel
// - User-specific data (requires authentication)

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
} from '@/lib/services/referral/referral.service';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { constants } from '@/lib/constants';
import { env } from '@/lib/env';

/**
 * Calculate months elapsed between two dates using date-fns for accurate calculation
 */
function getMonthsElapsed(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return differenceInMonths(end, start);
}

/**
 * Check if today is the 1st of the month
 */
function isFirstOfMonth(): boolean {
  const today = new Date();
  return today.getDate() === constants.WITHDRAWAL_DAY_OF_MONTH;
}

/**
 * Get next withdrawal date (next 1st of month)
 */
function getNextFirstOfMonth(): { date: string; daysUntil: number } {
  const today = new Date();
  const currentDay = today.getDate();

  let nextDate: Date;
  if (currentDay === 1) {
    // If today is the 1st, next withdrawal is next month's 1st
    nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (currentDay < 1) {
    // Should never happen, but handle edge case
    nextDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else {
    // If past the 1st, next withdrawal is next month's 1st
    nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }

  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    date: nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    daysUntil,
  };
}

/**
 * Format date for display (e.g., "Jan 15, 2025")
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get all dashboard data for authenticated user
 */
export async function getDashboardData(userId: string): Promise<{
  stats: {
    totalStaked: number;
    earnedToDate: number;
    referralEarnings: number;
    availableNow: number;
    activeStakesCount: number;
    totalReferrals: number;
  };
  stakes: Array<{
    id: string;
    amount: number;
    startDate: string;
    monthsElapsed: number;
    totalMonths: number;
    dailyEarning: number;
    monthlyEarning: number;
    totalEarned: number;
    nextRewardDate: string;
    status: string;
  }>;
  referrals: {
    totalEarnings: number;
    levels: Array<{
      level: number;
      count: number;
      rate: number;
      earnings: number;
    }>;
  };
  withdrawal: {
    availableAmount: number;
    nextWithdrawalDate: string;
    daysUntilWithdrawal: number;
    isWithdrawalAvailable: boolean;
    breakdown: {
      referralCommissions: number;
      stakeRewards: Array<{
        stakeId: string;
        amount: number;
        reward: number;
      }>;
      totalStakeRewards: number;
    };
  };
  withdrawalHistory: Array<{
    id: string;
    date: string;
    source: string;
    sourceDetail: string;
    amount: number;
    txHash?: string;
    status: string;
  }>;
  referralLink: string;
}> {
  try {
    // Fetch all data in parallel for performance
    const [user, allStakes, allCommissions, completedWithdrawals, stakeConfig, referralConfig] =
      await Promise.all([
        getUserById(userId),
        getStakesByUserId(userId),
        getUserCommissions(userId),
        getWithdrawalsByUserId(userId),
        getStakeConfigById('default'),
        getReferralConfigById('default'),
      ]);

    // Filter for active stakes only
    const activeStakes = allStakes.filter((stake) => stake.status === StakeStatus.ACTIVE);

    if (!user) {
      throw new Error('User not found');
    }

    // Get additional referral data
    const [commissionsByLevel, networkStructure] = await Promise.all([
      getCommissionsByLevel(userId),
      getNetworkStructure(userId),
    ]);

    // --- STATS OVERVIEW ---

    // Total staked amount (all active stakes)
    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);

    // Active stakes count
    const activeStakesCount = activeStakes.length;

    // Monthly rate from config
    const monthlyRate = stakeConfig?.monthlyReturnRate || 0.08;

    // Calculate earned to date (total earnings from all stakes)
    const earnedToDate = activeStakes.reduce((sum, stake) => {
      const monthsElapsed = getMonthsElapsed(stake.startDate);
      return sum + stake.amount * monthlyRate * monthsElapsed;
    }, 0);

    // Referral earnings (total commissions)
    const referralEarnings = allCommissions.reduce(
      (sum, commission) => sum + commission.commissionAmount,
      0
    );

    // Total withdrawn amount
    const totalWithdrawn = completedWithdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .reduce((sum, w) => sum + w.amount, 0);

    // Available now = total earned (stakes + referrals) - total withdrawn
    const availableNow = Math.max(0, earnedToDate + referralEarnings - totalWithdrawn);

    // Total unique referrals (sum of unique users across all levels)
    const totalReferrals = networkStructure.reduce((sum, level) => sum + level.uniqueUsers, 0);

    // --- STAKES LIST ---

    const stakes = activeStakes.map((stake) => {
      const monthsElapsed = getMonthsElapsed(stake.startDate);
      const totalMonths = stakeConfig?.durationMonths || 24;
      const monthlyEarning = stake.amount * monthlyRate;
      const dailyEarning = monthlyEarning / 30;
      const totalEarned = monthlyEarning * monthsElapsed;

      // Next reward date is always the 1st of next month
      const nextReward = getNextFirstOfMonth();

      return {
        id: stake.stakeId,
        amount: stake.amount,
        startDate: formatDateShort(stake.startDate),
        monthsElapsed,
        totalMonths,
        dailyEarning: Math.round(dailyEarning * 100) / 100,
        monthlyEarning: Math.round(monthlyEarning * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        nextRewardDate: nextReward.date,
        status: 'Active',
      };
    });

    // --- REFERRAL NETWORK ---

    // Total earnings from referrals
    const totalReferralEarnings = referralEarnings;

    // Get rates from config
    const commissionRates = referralConfig?.commissionRates || [0.08, 0.03, 0.02, 0.01, 0.01];

    // Build levels array with counts and earnings
    const levels = commissionsByLevel.map((levelData) => ({
      level: levelData.level,
      count: levelData.count,
      rate: (commissionRates[levelData.level - 1] || 0) * 100, // Convert to percentage
      earnings: Math.round(levelData.totalEarnings * 100) / 100,
    }));

    // Fill missing levels (1-5)
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

    // --- WITHDRAWAL INFO ---

    const nextWithdrawal = getNextFirstOfMonth();
    const isWithdrawalAvailable = isFirstOfMonth();

    // Calculate current month's stake rewards (only if not withdrawn yet this month)
    const stakeRewards = activeStakes.map((stake) => {
      const monthlyReward = stake.amount * monthlyRate;
      return {
        stakeId: stake.stakeId,
        amount: stake.amount,
        reward: Math.round(monthlyReward * 100) / 100,
      };
    });

    const totalStakeRewards = stakeRewards.reduce((sum, sr) => sum + sr.reward, 0);

    // --- WITHDRAWAL HISTORY ---

    // Map completed withdrawals to display format
    const withdrawalHistory = completedWithdrawals
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA; // Most recent first
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

    // --- REFERRAL LINK ---

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
        totalEarnings: Math.round(totalReferralEarnings * 100) / 100,
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
