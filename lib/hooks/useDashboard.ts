'use client';

export const useDashboard = () => {
  // Dummy wallet data
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f4a8e';

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
      stakeRewards: 984,
      referralCommissions: 245,
    },
  };

  // Dummy referral link
  const referralLink = 'https://massivehikecoin.io/ref/0x742d...4a8e';

  return {
    walletAddress,
    stats,
    stakes,
    referrals,
    withdrawal,
    referralLink,
  };
};
