// Page Data Utilities
// Landing page and referrals page data aggregation

import { getStakesByUserId, getStakesByStatus } from '@/lib/db/repositories/stake.repository';
import { getWithdrawalsByStatus } from '@/lib/db/repositories/withdrawal.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { getUserCommissions, getNetworkStructure, getTotalCommissionRate } from '@/lib/utils/referrals';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { env } from '@/lib/env';

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function getLandingPageData() {
  try {
    const [activeStakes, completedWithdrawals, referralConfig, stakeConfig] = await Promise.all([
      getStakesByStatus(StakeStatus.ACTIVE),
      getWithdrawalsByStatus(WithdrawalStatus.COMPLETED),
      getReferralConfigById('default'),
      getStakeConfigById('default'),
    ]);

    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const uniqueStakers = new Set(activeStakes.map((stake) => stake.userId));
    const activeStakers = uniqueStakers.size;
    const totalRewardsDistributed = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

    const referralRates = referralConfig
      ? referralConfig.commissionRates.map((rate, index) => ({
          level: index + 1,
          rate: rate * 100,
          label: index === 0 ? 'Direct Referrals' : `Level ${index + 1}`,
        }))
      : [
          { level: 1, rate: 8, label: 'Direct Referrals' },
          { level: 2, rate: 3, label: 'Level 2' },
          { level: 3, rate: 2, label: 'Level 3' },
          { level: 4, rate: 1, label: 'Level 4' },
          { level: 5, rate: 1, label: 'Level 5' },
        ];

    const stakingRate = stakeConfig ? stakeConfig.monthlyReturnRate * 100 : 8;
    const maxReferralRate = referralConfig ? getTotalCommissionRate(referralConfig) * 100 : 15;

    return {
      stats: { totalStaked, activeStakers, totalRewardsDistributed },
      referralRates,
      rewardRates: { stakingRate, maxReferralRate },
    };
  } catch (error) {
    console.error('Error fetching landing page data:', error);
    return {
      stats: { totalStaked: 0, activeStakers: 0, totalRewardsDistributed: 0 },
      referralRates: [
        { level: 1, rate: 8, label: 'Direct Referrals' },
        { level: 2, rate: 3, label: 'Level 2' },
        { level: 3, rate: 2, label: 'Level 3' },
        { level: 4, rate: 1, label: 'Level 4' },
        { level: 5, rate: 1, label: 'Level 5' },
      ],
      rewardRates: { stakingRate: 8, maxReferralRate: 15 },
    };
  }
}

export async function getReferralsPageData(userId: string) {
  try {
    const [user, userStakes, allCommissions, referralConfig, networkStructure] = await Promise.all([
      getUserById(userId),
      getStakesByUserId(userId),
      getUserCommissions(userId),
      getReferralConfigById('default'),
      getNetworkStructure(userId),
    ]);

    if (!user) throw new Error('User not found');

    const uniqueReferredUserIds = [...new Set(allCommissions.map((c) => c.referredUserId))];
    const [referredUsersData, referredUsersStakes] = await Promise.all([
      Promise.all(uniqueReferredUserIds.map((id) => getUserById(id))),
      Promise.all(uniqueReferredUserIds.map((id) => getStakesByUserId(id))),
    ]);

    const userMap = new Map(referredUsersData.map((u) => (u ? [u.userId, u] : null)).filter(Boolean) as Array<[string, any]>);
    const stakesMap = new Map(uniqueReferredUserIds.map((id, index) => [id, referredUsersStakes[index]]));

    const totalEarnings = allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const directReferrals = networkStructure.find((level) => level.level === 1)?.uniqueUsers || 0;
    const totalNetwork = networkStructure.reduce((sum, level) => sum + level.uniqueUsers, 0);
    const networkTVL = networkStructure.reduce((sum, level) => sum + level.totalStaked, 0);
    const avgCommission = totalNetwork > 0 ? (totalEarnings / networkTVL) * 100 : 0;

    const activeUserStakes = userStakes.filter((stake) => stake.status === StakeStatus.ACTIVE);
    const rootUserStaked = activeUserStakes.reduce((sum, stake) => sum + stake.amount, 0);

    const commissionRates = referralConfig?.commissionRates || [0.08, 0.03, 0.02, 0.01, 0.01];

    const levelSummary = [];
    for (let i = 1; i <= 5; i++) {
      const levelData = networkStructure.find((level) => level.level === i);
      levelSummary.push({
        level: i,
        members: levelData?.uniqueUsers || 0,
        totalStaked: Math.round((levelData?.totalStaked || 0) * 100) / 100,
        commissionRate: (commissionRates[i - 1] || 0) * 100,
        yourEarnings: Math.round((levelData?.totalEarnings || 0) * 100) / 100,
      });
    }

    const sortedCommissions = [...allCommissions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const recentEarnings = sortedCommissions.slice(0, 10).map((commission) => {
      const referredUser = userMap.get(commission.referredUserId);
      return {
        referralName: referredUser?.name || 'Unknown User',
        level: commission.level,
        amount: Math.round(commission.commissionAmount * 100) / 100,
        date: formatDateShort(commission.createdAt),
      };
    });

    const commissionRatesDisplay = commissionRates.map((rate, index) => ({
      level: index + 1,
      rate: rate * 100,
      label: index === 0 ? 'Level 1 (Direct)' : `Level ${index + 1}`,
    }));

    const referralLink = `${env.NEXT_PUBLIC_BASE_URL}/ref/${user.referralCode}`;

    const allReferrals = uniqueReferredUserIds
      .map((referredUserId) => {
        const referredUser = userMap.get(referredUserId);
        if (!referredUser) return null;

        const userCommission = allCommissions.find((c) => c.referredUserId === referredUserId);
        const level = userCommission?.level || 1;

        const earningsFromUser = allCommissions
          .filter((c) => c.referredUserId === referredUserId)
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const userStakesData = stakesMap.get(referredUserId) || [];
        const activeStakes = userStakesData.filter((stake) => stake.status === StakeStatus.ACTIVE);
        const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);

        return {
          name: referredUser.name,
          level,
          joinedDate: formatDateShort(referredUser.createdAt),
          staked: Math.round(totalStaked * 100) / 100,
          yourEarnings: Math.round(earningsFromUser * 100) / 100,
        };
      })
      .filter(Boolean) as Array<any>;

    allReferrals.sort((a, b) => {
      const dateA = new Date(a.joinedDate).getTime();
      const dateB = new Date(b.joinedDate).getTime();
      return dateB - dateA;
    });

    return {
      stats: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        directReferrals,
        totalNetwork,
        networkTVL: Math.round(networkTVL * 100) / 100,
        avgCommission: Math.round(avgCommission * 100) / 100,
      },
      rootUser: {
        name: user.name,
        staked: Math.round(rootUserStaked * 100) / 100,
        network: totalNetwork,
      },
      levelSummary,
      recentEarnings,
      commissionRates: commissionRatesDisplay,
      referralLink,
      allReferrals,
    };
  } catch (error) {
    console.error('Error fetching referrals page data:', error);
    throw error;
  }
}
