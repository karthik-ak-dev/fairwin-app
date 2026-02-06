'use client';

import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useReferralsPage = () => {
  // Fetch referrals page data from API
  const { data, error, isLoading } = useSWR('/api/referrals', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 120000, // 2 minutes (referral data changes less frequently)
  });

  // Fallback data while loading or on error
  const fallbackStats = {
    totalEarnings: 0,
    directReferrals: 0,
    totalNetwork: 0,
    networkTVL: 0,
    avgCommission: 0,
  };

  const fallbackRootUser = {
    name: 'Loading...',
    staked: 0,
    network: 0,
  };

  const fallbackLevelSummary: Array<{
    level: number;
    members: number;
    totalStaked: number;
    commissionRate: number;
    yourEarnings: number;
  }> = [
    { level: 1, members: 0, totalStaked: 0, commissionRate: 8, yourEarnings: 0 },
    { level: 2, members: 0, totalStaked: 0, commissionRate: 3, yourEarnings: 0 },
    { level: 3, members: 0, totalStaked: 0, commissionRate: 2, yourEarnings: 0 },
    { level: 4, members: 0, totalStaked: 0, commissionRate: 1, yourEarnings: 0 },
    { level: 5, members: 0, totalStaked: 0, commissionRate: 1, yourEarnings: 0 },
  ];

  const fallbackRecentEarnings: Array<{
    referralName: string;
    level: number;
    amount: number;
    date: string;
  }> = [];

  const fallbackCommissionRates = [
    { level: 1, rate: 8, label: 'Level 1 (Direct)' },
    { level: 2, rate: 3, label: 'Level 2' },
    { level: 3, rate: 2, label: 'Level 3' },
    { level: 4, rate: 1, label: 'Level 4' },
    { level: 5, rate: 1, label: 'Level 5' },
  ];

  const fallbackReferralLink = '';

  const fallbackAllReferrals: Array<{
    name: string;
    level: number;
    joinedDate: string;
    staked: number;
    yourEarnings: number;
  }> = [];

  return {
    stats: data?.stats || fallbackStats,
    rootUser: data?.rootUser || fallbackRootUser,
    levelSummary: data?.levelSummary || fallbackLevelSummary,
    recentEarnings: data?.recentEarnings || fallbackRecentEarnings,
    commissionRates: data?.commissionRates || fallbackCommissionRates,
    referralLink: data?.referralLink || fallbackReferralLink,
    allReferrals: data?.allReferrals || fallbackAllReferrals,
    isLoading,
    error,
  };
};
