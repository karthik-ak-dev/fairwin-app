// Landing page hook with dummy data
export const useLanding = () => {
  // Dummy platform statistics
  const stats = {
    totalStaked: 2500000, // $2.5M
    activeStakers: 1247,
    totalRewardsDistributed: 180000, // $180K
  };

  // Dummy referral commission rates
  const referralRates = [
    { level: 1, rate: 8, label: "Direct Referrals" },
    { level: 2, rate: 3, label: "Level 2" },
    { level: 3, rate: 2, label: "Level 3" },
    { level: 4, rate: 1, label: "Level 4" },
    { level: 5, rate: 1, label: "Level 5" },
  ];

  return {
    stats,
    referralRates,
  };
};
