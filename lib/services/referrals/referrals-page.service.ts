// Referrals Page Service
// Responsibilities:
// - Aggregate all referral network data for authenticated user
// - Calculate stats, level summary, recent earnings, all referrals list
// - Single API call pattern - fetch everything at once (MVP approach)
// - User-specific data (requires authentication)

import { getUserById } from '@/lib/db/repositories/user.repository';
import { getStakesByUserId } from '@/lib/db/repositories/stake.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import {
  getUserCommissions,
  getNetworkStructure,
} from '@/lib/services/referral/referral.service';
import { StakeStatus } from '@/lib/db/models/stake.model';

/**
 * Format date for display (e.g., "Jan 15, 2025")
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get all referrals page data for authenticated user
 */
export async function getReferralsPageData(userId: string): Promise<{
  stats: {
    totalEarnings: number;
    directReferrals: number;
    totalNetwork: number;
    networkTVL: number;
    avgCommission: number;
  };
  rootUser: {
    name: string;
    staked: number;
    network: number;
  };
  levelSummary: Array<{
    level: number;
    members: number;
    totalStaked: number;
    commissionRate: number;
    yourEarnings: number;
  }>;
  recentEarnings: Array<{
    referralName: string;
    level: number;
    amount: number;
    date: string;
  }>;
  commissionRates: Array<{
    level: number;
    rate: number;
    label: string;
  }>;
  referralLink: string;
  allReferrals: Array<{
    name: string;
    level: number;
    joinedDate: string;
    staked: number;
    yourEarnings: number;
  }>;
}> {
  try {
    // Phase 1: Fetch base data in parallel
    const [user, userStakes, allCommissions, referralConfig, networkStructure] = await Promise.all([
      getUserById(userId),
      getStakesByUserId(userId),
      getUserCommissions(userId), // All commissions earned by this user
      getReferralConfigById('default'),
      getNetworkStructure(userId), // Already aggregates by level
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Phase 2: Extract unique referred users from commissions
    const uniqueReferredUserIds = [...new Set(allCommissions.map((c) => c.referredUserId))];

    // Phase 3: Fetch all referred users' data in parallel (MVP - no pagination)
    const [referredUsersData, referredUsersStakes] = await Promise.all([
      Promise.all(uniqueReferredUserIds.map((id) => getUserById(id))),
      Promise.all(uniqueReferredUserIds.map((id) => getStakesByUserId(id))),
    ]);

    // Create maps for quick lookup
    const userMap = new Map(referredUsersData.map((u) => (u ? [u.userId, u] : null)).filter(Boolean) as Array<[string, any]>);
    const stakesMap = new Map(uniqueReferredUserIds.map((id, index) => [id, referredUsersStakes[index]]));

    // --- STATS OVERVIEW ---

    // Total earnings from all commissions
    const totalEarnings = allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    // Direct referrals (Level 1)
    const directReferrals = networkStructure.find((level) => level.level === 1)?.uniqueUsers || 0;

    // Total network size (sum of all levels)
    const totalNetwork = networkStructure.reduce((sum, level) => sum + level.uniqueUsers, 0);

    // Network TVL (total staked by entire network)
    const networkTVL = networkStructure.reduce((sum, level) => sum + level.totalStaked, 0);

    // Average commission rate (weighted by commission amounts)
    const avgCommission = totalNetwork > 0 ? (totalEarnings / networkTVL) * 100 : 0;

    // --- ROOT USER INFO ---

    // User's total staked amount
    const activeUserStakes = userStakes.filter((stake) => stake.status === StakeStatus.ACTIVE);
    const rootUserStaked = activeUserStakes.reduce((sum, stake) => sum + stake.amount, 0);

    // --- LEVEL SUMMARY ---

    const commissionRates = referralConfig?.commissionRates || [0.08, 0.03, 0.02, 0.01, 0.01];

    // Build level summary (ensure all 5 levels are present)
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

    // --- RECENT EARNINGS ---

    // Sort commissions by date descending and take top 10
    const sortedCommissions = [...allCommissions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
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

    // --- COMMISSION RATES (for sidebar) ---

    const commissionRatesDisplay = commissionRates.map((rate, index) => ({
      level: index + 1,
      rate: rate * 100,
      label: index === 0 ? 'Level 1 (Direct)' : `Level ${index + 1}`,
    }));

    // --- REFERRAL LINK ---

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://massivehike.com';
    const referralLink = `${baseUrl}/ref/${user.referralCode}`;

    // --- ALL REFERRALS ---

    // Build complete referrals list with user details
    const allReferrals = uniqueReferredUserIds
      .map((referredUserId) => {
        const referredUser = userMap.get(referredUserId);
        if (!referredUser) return null;

        // Find user's level (from first commission record)
        const userCommission = allCommissions.find((c) => c.referredUserId === referredUserId);
        const level = userCommission?.level || 1;

        // Calculate total earnings from this user
        const earningsFromUser = allCommissions
          .filter((c) => c.referredUserId === referredUserId)
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        // Calculate user's total staked amount
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
      .filter(Boolean) as Array<{
        name: string;
        level: number;
        joinedDate: string;
        staked: number;
        yourEarnings: number;
      }>;

    // Sort by joined date descending (newest first)
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
