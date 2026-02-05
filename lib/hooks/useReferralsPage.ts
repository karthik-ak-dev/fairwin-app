'use client';

export const useReferralsPage = () => {
  // User authenticated via Google SSO
  // User info fetched from useAuth hook

  // Dummy stats (matching design)
  const stats = {
    totalEarnings: 145.50,
    directReferrals: 3,
    totalNetwork: 9,
    networkTVL: 3200,
    avgCommission: 8.4,
  };

  // Root user data (current user from Google SSO)
  const rootUser = {
    name: 'John Doe', // From Google SSO
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

  // Recent earnings table (showing referral names instead of wallet addresses)
  const recentEarnings = [
    {
      referralName: 'Sarah Johnson',
      level: 1,
      amount: 100.00,
      date: 'Feb 15, 2026',
    },
    {
      referralName: 'Michael Chen',
      level: 1,
      amount: 75.00,
      date: 'Jan 10, 2026',
    },
    {
      referralName: 'Emily Davis',
      level: 1,
      amount: 50.00,
      date: 'Jan 3, 2026',
    },
    {
      referralName: 'Robert Smith',
      level: 2,
      amount: 20.00,
      date: 'Dec 28, 2025',
    },
    {
      referralName: 'Lisa Anderson',
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
  // Now showing user names from Google SSO instead of wallet addresses
  const allReferrals = [
    {
      name: 'Sarah Johnson',
      level: 1,
      joinedDate: 'Jan 20, 2026',
      staked: 1000,
      yourEarnings: 100,
    },
    {
      name: 'Michael Chen',
      level: 1,
      joinedDate: 'Dec 5, 2025',
      staked: 750,
      yourEarnings: 75,
    },
    {
      name: 'Robert Smith',
      level: 2,
      joinedDate: 'Dec 12, 2025',
      staked: 400,
      yourEarnings: 20,
    },
    {
      name: 'Lisa Anderson',
      level: 2,
      joinedDate: 'Dec 15, 2025',
      staked: 300,
      yourEarnings: 15,
    },
    {
      name: 'Emily Davis',
      level: 1,
      joinedDate: 'Jan 3, 2026',
      staked: 500,
      yourEarnings: 50,
    },
    {
      name: 'David Wilson',
      level: 3,
      joinedDate: 'Dec 22, 2025',
      staked: 600,
      yourEarnings: 12,
    },
    {
      name: 'Jennifer Martinez',
      level: 4,
      joinedDate: 'Jan 10, 2026',
      staked: 800,
      yourEarnings: 8,
    },
    {
      name: 'James Taylor',
      level: 3,
      joinedDate: 'Jan 15, 2026',
      staked: 450,
      yourEarnings: 9,
    },
    {
      name: 'Patricia Brown',
      level: 5,
      joinedDate: 'Jan 25, 2026',
      staked: 300,
      yourEarnings: 3,
    },
  ];

  return {
    stats,
    rootUser,
    levelSummary,
    recentEarnings,
    commissionRates,
    referralLink,
    allReferrals,
  };
};
