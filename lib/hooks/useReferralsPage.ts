'use client';

export const useReferralsPage = () => {
  // Dummy wallet data
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f4a8e';

  // Dummy stats (matching design)
  const stats = {
    totalEarnings: 145.50,
    directReferrals: 3,
    totalNetwork: 9,
    networkTVL: 3200,
    avgCommission: 8.4,
  };

  // Root user data
  const rootUser = {
    address: '0x742d35c...f4a8e',
    staked: 500,
    network: 9,
  };

  // Level-wise aggregate data for the tree
  const levelSummary = [
    {
      level: 1,
      members: 3,
      totalStaked: 2250,
      commissionRate: 8,
      yourEarnings: 180,
    },
    {
      level: 2,
      members: 2,
      totalStaked: 700,
      commissionRate: 3,
      yourEarnings: 21,
    },
    {
      level: 3,
      members: 2,
      totalStaked: 1050,
      commissionRate: 2,
      yourEarnings: 21,
    },
    {
      level: 4,
      members: 1,
      totalStaked: 800,
      commissionRate: 1,
      yourEarnings: 8,
    },
    {
      level: 5,
      members: 1,
      totalStaked: 300,
      commissionRate: 1,
      yourEarnings: 3,
    },
  ];

  // Recent earnings table
  const recentEarnings = [
    {
      referral: '0x1c9f...5b8a',
      level: 1,
      amount: 100.00,
      date: 'Feb 15, 2026',
    },
    {
      referral: '0x8a3f...2b1c',
      level: 1,
      amount: 75.00,
      date: 'Jan 10, 2026',
    },
    {
      referral: '0x5e7a...9c2d',
      level: 1,
      amount: 50.00,
      date: 'Jan 3, 2026',
    },
    {
      referral: '0x4c2d...8f9a',
      level: 2,
      amount: 20.00,
      date: 'Dec 28, 2025',
    },
    {
      referral: '0x7b1e...3d4f',
      level: 2,
      amount: 15.00,
      date: 'Dec 20, 2025',
    },
  ];

  // Commission rates
  const commissionRates = [
    { level: 1, rate: 8, label: 'Level 1 (Direct)' },
    { level: 2, rate: 3, label: 'Level 2' },
    { level: 3, rate: 2, label: 'Level 3' },
    { level: 4, rate: 1, label: 'Level 4' },
    { level: 5, rate: 1, label: 'Level 5' },
  ];

  // Referral link
  const referralLink = 'massivehike.com/ref/MH742d';

  // All referrals list (ordered by join date, newest first)
  const allReferrals = [
    {
      address: '0x1c9f...5b8a',
      level: 1,
      joinedDate: 'Jan 20, 2026',
      staked: 1000,
      yourEarnings: 100,
    },
    {
      address: '0x8a3f...2b1c',
      level: 1,
      joinedDate: 'Dec 5, 2025',
      staked: 750,
      yourEarnings: 75,
    },
    {
      address: '0x4c2d...8f9a',
      level: 2,
      joinedDate: 'Dec 12, 2025',
      staked: 400,
      yourEarnings: 20,
    },
    {
      address: '0x7b1e...3d4f',
      level: 2,
      joinedDate: 'Dec 15, 2025',
      staked: 300,
      yourEarnings: 15,
    },
    {
      address: '0x5e7a...9c2d',
      level: 1,
      joinedDate: 'Jan 3, 2026',
      staked: 500,
      yourEarnings: 50,
    },
    {
      address: '0x9d2e...4a1b',
      level: 3,
      joinedDate: 'Dec 22, 2025',
      staked: 600,
      yourEarnings: 12,
    },
    {
      address: '0x3f8c...7e2d',
      level: 4,
      joinedDate: 'Jan 10, 2026',
      staked: 800,
      yourEarnings: 8,
    },
    {
      address: '0x6a1b...9f5c',
      level: 3,
      joinedDate: 'Jan 15, 2026',
      staked: 450,
      yourEarnings: 9,
    },
    {
      address: '0x2c5d...1e8a',
      level: 5,
      joinedDate: 'Jan 25, 2026',
      staked: 300,
      yourEarnings: 3,
    },
  ];

  return {
    walletAddress,
    stats,
    rootUser,
    levelSummary,
    recentEarnings,
    commissionRates,
    referralLink,
    allReferrals,
  };
};
