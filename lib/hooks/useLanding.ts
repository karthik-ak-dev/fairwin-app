'use client';

import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useLanding = () => {
  // Fetch landing page data from API
  const { data, error, isLoading } = useSWR('/api/landing', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
  });

  // Fallback data while loading or on error
  const fallbackStats = {
    totalStaked: 0,
    activeStakers: 0,
    totalRewardsDistributed: 0,
  };

  const fallbackReferralRates = [
    { level: 1, rate: 8, label: 'Direct Referrals' },
    { level: 2, rate: 3, label: 'Level 2' },
    { level: 3, rate: 2, label: 'Level 3' },
    { level: 4, rate: 1, label: 'Level 4' },
    { level: 5, rate: 1, label: 'Level 5' },
  ];

  return {
    stats: data?.stats || fallbackStats,
    referralRates: data?.referralRates || fallbackReferralRates,
    isLoading,
    error,
  };
};
