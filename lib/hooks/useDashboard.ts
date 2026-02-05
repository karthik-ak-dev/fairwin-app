'use client';

export const useDashboard = () => {
  // User is authenticated via Google SSO
  // User info (name, email, picture) is fetched from useAuth hook

  // Dummy stats overview
  const stats = {
    totalStaked: 12300,
    earnedToDate: 7872,
    referralEarnings: 1245,
    availableNow: 1229,
    activeStakesCount: 3,
    totalReferrals: 12,
  };

  // Dummy stakes data
  const stakes = [
    {
      id: '1',
      amount: 5000,
      startDate: '2025-06-15',
      monthsElapsed: 8,
      totalMonths: 24,
      dailyEarning: 13.33,
      monthlyEarning: 400,
      totalEarned: 3200,
      nextRewardDate: 'Feb 1, 2026',
      status: 'Active',
    },
    {
      id: '2',
      amount: 5000,
      startDate: '2025-09-01',
      monthsElapsed: 5,
      totalMonths: 24,
      dailyEarning: 13.33,
      monthlyEarning: 400,
      totalEarned: 2000,
      nextRewardDate: 'Feb 1, 2026',
      status: 'Active',
    },
    {
      id: '3',
      amount: 2300,
      startDate: '2025-12-10',
      monthsElapsed: 2,
      totalMonths: 24,
      dailyEarning: 6.13,
      monthlyEarning: 184,
      totalEarned: 368,
      nextRewardDate: 'Feb 1, 2026',
      status: 'Active',
    },
  ];

  // Dummy referral data
  const referrals = {
    totalEarnings: 1245,
    levels: [
      { level: 1, count: 5, rate: 8, earnings: 640 },
      { level: 2, count: 3, rate: 3, earnings: 240 },
      { level: 3, count: 2, rate: 2, earnings: 180 },
      { level: 4, count: 1, rate: 1, earnings: 100 },
      { level: 5, count: 1, rate: 1, earnings: 85 },
    ],
  };

  // Dummy withdrawal data
  const withdrawal = {
    availableAmount: 1229,
    nextWithdrawalDate: 'February 1, 2026',
    daysUntilWithdrawal: 0, // 0 means withdrawal is available now
    isWithdrawalAvailable: true,
    breakdown: {
      referralCommissions: 245,
      // Per-stake rewards breakdown
      stakeRewards: [
        { stakeId: '1', amount: 5000, reward: 400 },
        { stakeId: '2', amount: 5000, reward: 400 },
        { stakeId: '3', amount: 2300, reward: 184 },
      ],
      totalStakeRewards: 984,
    },
  };

  // Dummy withdrawal history - expanded format showing each stake and referral commission separately
  const withdrawalHistory = [
    // January 2026 withdrawal
    {
      id: 'wd_001_stake1',
      date: 'Jan 1, 2026',
      source: 'Stake #1',
      sourceDetail: '$5,000.00',
      amount: 400,
      txHash: '0x8a3f...2b1c',
      status: 'Completed',
    },
    {
      id: 'wd_001_stake2',
      date: 'Jan 1, 2026',
      source: 'Stake #2',
      sourceDetail: '$5,000.00',
      amount: 400,
      txHash: '0x8a3f...2b1c',
      status: 'Completed',
    },
    {
      id: 'wd_001_stake3',
      date: 'Jan 1, 2026',
      source: 'Stake #3',
      sourceDetail: '$2,300.00',
      amount: 120,
      txHash: '0x8a3f...2b1c',
      status: 'Completed',
    },
    {
      id: 'wd_001_referral',
      date: 'Jan 1, 2026',
      source: 'Referral Commission',
      sourceDetail: 'All Levels',
      amount: 230,
      txHash: '0x8a3f...2b1c',
      status: 'Completed',
    },

    // December 2025 withdrawal
    {
      id: 'wd_002_stake1',
      date: 'Dec 1, 2025',
      source: 'Stake #1',
      sourceDetail: '$5,000.00',
      amount: 400,
      txHash: '0x5e7a...9c2d',
      status: 'Completed',
    },
    {
      id: 'wd_002_stake2',
      date: 'Dec 1, 2025',
      source: 'Stake #2',
      sourceDetail: '$5,000.00',
      amount: 400,
      txHash: '0x5e7a...9c2d',
      status: 'Completed',
    },
    {
      id: 'wd_002_stake3',
      date: 'Dec 1, 2025',
      source: 'Stake #3',
      sourceDetail: '$2,300.00',
      amount: 70,
      txHash: '0x5e7a...9c2d',
      status: 'Completed',
    },
    {
      id: 'wd_002_referral',
      date: 'Dec 1, 2025',
      source: 'Referral Commission',
      sourceDetail: 'All Levels',
      amount: 210,
      txHash: '0x5e7a...9c2d',
      status: 'Completed',
    },

    // November 2025 withdrawal
    {
      id: 'wd_003_stake1',
      date: 'Nov 1, 2025',
      source: 'Stake #1',
      sourceDetail: '$5,000.00',
      amount: 400,
      txHash: '0x9d2e...4a1b',
      status: 'Completed',
    },
    {
      id: 'wd_003_stake2',
      date: 'Nov 1, 2025',
      source: 'Stake #2',
      sourceDetail: '$5,000.00',
      amount: 120,
      txHash: '0x9d2e...4a1b',
      status: 'Completed',
    },
    {
      id: 'wd_003_referral',
      date: 'Nov 1, 2025',
      source: 'Referral Commission',
      sourceDetail: 'All Levels',
      amount: 120,
      txHash: '0x9d2e...4a1b',
      status: 'Completed',
    },
  ];

  // Dummy referral link
  const referralLink = 'massivehike.com/ref/MH742d';

  return {
    stats,
    stakes,
    referrals,
    withdrawal,
    withdrawalHistory,
    referralLink,
  };
};
