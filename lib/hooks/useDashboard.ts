'use client';

import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useDashboard = () => {
  // Fetch dashboard data from API
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute (user-specific data changes more frequently)
  });

  // Fallback data while loading or on error
  const fallbackStats = {
    totalStaked: 0,
    earnedToDate: 0,
    referralEarnings: 0,
    availableNow: 0,
    activeStakesCount: 0,
    totalReferrals: 0,
  };

  const fallbackStakes: Array<{
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
  }> = [];

  const fallbackReferrals = {
    totalEarnings: 0,
    levels: [
      { level: 1, count: 0, rate: 8, earnings: 0 },
      { level: 2, count: 0, rate: 3, earnings: 0 },
      { level: 3, count: 0, rate: 2, earnings: 0 },
      { level: 4, count: 0, rate: 1, earnings: 0 },
      { level: 5, count: 0, rate: 1, earnings: 0 },
    ],
  };

  const fallbackWithdrawal = {
    availableAmount: 0,
    nextWithdrawalDate: 'Loading...',
    daysUntilWithdrawal: 0,
    isWithdrawalAvailable: false,
    breakdown: {
      referralCommissions: 0,
      stakeRewards: [],
      totalStakeRewards: 0,
    },
  };

  const fallbackWithdrawalHistory: Array<{
    id: string;
    date: string;
    source: string;
    sourceDetail: string;
    amount: number;
    txHash?: string;
    status: string;
  }> = [];

  const fallbackReferralLink = '';

  return {
    stats: data?.stats || fallbackStats,
    stakes: data?.stakes || fallbackStakes,
    referrals: data?.referrals || fallbackReferrals,
    withdrawal: data?.withdrawal || fallbackWithdrawal,
    withdrawalHistory: data?.withdrawalHistory || fallbackWithdrawalHistory,
    referralLink: data?.referralLink || fallbackReferralLink,
    isLoading,
    error,
  };
};
