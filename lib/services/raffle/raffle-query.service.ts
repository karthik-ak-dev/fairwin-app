/**
 * Raffle Query Service
 *
 * Handles complex raffle queries and data enrichment.
 * This service combines:
 * - Raffle data retrieval with enrichment
 * - Display status computation
 * - Time-based status logic
 *
 * Provides comprehensive raffle data with computed display status.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { RaffleStatus, PayoutStatus } from '@/lib/db/models';
import type { RaffleItem, EntryItem } from '@/lib/db/models';
import type {
  EnrichedRaffle,
  ListRafflesParams,
  PaginatedRaffles,
  ListWinnersParams,
  PaginatedWinners,
  DisplayStatus,
} from './types';
import { RaffleNotFoundError } from '../errors';
import { decodeCursor, encodeCursor } from '../shared/pagination.service';
import { pagination, auth } from '@/lib/constants';

// ============================================================================
// Display Status Computation
// ============================================================================

/**
 * Compute display status from raffle data
 *
 * Logic Flow:
 * 1. If status is terminal (completed/cancelled) → return as-is
 * 2. If status is drawing → return 'drawing'
 * 3. If before startTime → return 'scheduled'
 * 4. If < 5min until endTime → return 'ending' (urgency UI)
 * 5. Otherwise return status
 *
 * @param raffle Raffle item with status and time fields
 * @returns Display status for frontend
 */
export function computeDisplayStatus(raffle: Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>): DisplayStatus {
  // Terminal states - return as-is
  if (raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED) {
    return raffle.status;
  }

  // Drawing state
  if (raffle.status === RaffleStatus.DRAWING) {
    return RaffleStatus.DRAWING;
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  // Before start time → show as scheduled
  if (now < startTime) {
    return RaffleStatus.SCHEDULED;
  }

  // Less than 5 minutes until end → show urgency
  const ENDING_THRESHOLD = auth.CHALLENGE_EXPIRATION_MS; // 5 minutes in milliseconds
  if (raffle.status === RaffleStatus.ACTIVE && endTime - now <= ENDING_THRESHOLD && now < endTime) {
    return RaffleStatus.ENDING;
  }

  // Otherwise, display status matches base status
  return raffle.status;
}

// ============================================================================
// Raffle Query Operations
// ============================================================================

/**
 * Calculate entry distribution showing how users are distributed by entry count
 * Returns a histogram of users per entry count range
 */
async function calculateEntryDistribution(raffleId: string) {
  // Get all entries for this raffle (paginate through all)
  const allEntries: EntryItem[] = [];
  let lastKey;

  do {
    const result = await entryRepo.getByRafflePaginated(raffleId, 100, lastKey);
    allEntries.push(...result.items);
    lastKey = result.lastKey;
  } while (lastKey);

  // Group entries by wallet address to count total entries per user
  const userEntryMap = new Map<string, number>();
  for (const entry of allEntries) {
    const current = userEntryMap.get(entry.walletAddress) || 0;
    userEntryMap.set(entry.walletAddress, current + entry.numEntries);
  }

  // Create histogram: count how many users have each entry count
  const histogram = new Map<number, number>();

  for (const [, entryCount] of Array.from(userEntryMap.entries())) {
    const current = histogram.get(entryCount) || 0;
    histogram.set(entryCount, current + 1);
  }

  // Convert to sorted array for easy display
  const distribution = Array.from(histogram.entries())
    .map(([entries, userCount]) => ({ entries, userCount }))
    .sort((a, b) => a.entries - b.entries);

  return distribution;
}

/**
 * Calculate prize breakdown with actual amounts for each tier
 */
function calculatePrizeTierBreakdown(raffle: RaffleItem) {
  return raffle.prizeTiers.map(tier => ({
    name: tier.name,
    percentage: tier.percentage,
    winnerCount: tier.winnerCount,
    totalAmount: Math.floor((raffle.winnerPayout * tier.percentage) / 100),
    amountPerWinner: Math.floor((raffle.winnerPayout * tier.percentage) / 100 / tier.winnerCount),
  }));
}

/**
 * Get raffle with enriched data
 *
 * Includes:
 * - Raffle details
 * - Recent entries (last 10)
 * - Winners (if completed)
 * - User-specific data (if wallet provided)
 * - Entry distribution by user entry counts
 * - Prize tier breakdown with calculated amounts
 */
export async function getRaffleWithDetails(
  raffleId: string,
  walletAddress?: string
): Promise<EnrichedRaffle> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get recent entries
  const recentEntriesLimit = 10;
  const entriesResult = await entryRepo.getByRafflePaginated(raffleId, recentEntriesLimit);
  const recentEntries = entriesResult.items;

  // Get winners if completed
  let winners: any[] = [];
  if (raffle.status === RaffleStatus.COMPLETED) {
    const winnersResult = await winnerRepo.getByRaffle(raffleId);
    winners = winnersResult.items;
  }

  // Get user-specific data if wallet provided
  let userStats;
  if (walletAddress) {
    // Fetch only this user's entries for the raffle
    const userEntries = await entryRepo.getUserEntriesForRaffle(raffleId, walletAddress);

    // Calculate user's entry count and total spent
    const entryCount = userEntries.reduce((sum, e) => sum + e.numEntries, 0);
    const totalSpent = userEntries.reduce((sum, e) => sum + e.totalPaid, 0);

    userStats = {
      entries: entryCount,
      totalSpent,
    };
  }

  // Calculate entry distribution
  const entryDistribution = await calculateEntryDistribution(raffleId);

  // Calculate prize tier breakdown with amounts
  const prizeTierBreakdown = calculatePrizeTierBreakdown(raffle);

  // Enrich raffle with displayStatus
  const displayStatus = computeDisplayStatus(raffle);

  return {
    raffle: {
      ...raffle,
      displayStatus, // Add computed display status for UI
    } as any,
    recentEntries,
    winners,
    userStats,
    entryDistribution,
    prizeTierBreakdown,
  };
}

/**
 * Get winners for a raffle
 *
 * @param raffleId - The raffle ID
 * @returns Array of winners
 */
export async function getRaffleWinners(raffleId: string) {
  const result = await winnerRepo.getByRaffle(raffleId);
  return result.items;
}

/**
 * List winners with optional filtering and pagination
 *
 * Supports filtering by:
 * - raffleId: Get winners for a specific raffle
 * - payoutStatus: Get winners by payout status (pending, paid, failed, processing)
 *
 * If no filters provided, defaults to pending payouts for admin dashboard
 */
export async function listWinners(params: ListWinnersParams = {}): Promise<PaginatedWinners> {
  const { raffleId, payoutStatus, cursor } = params;
  const limit: number = params.limit ?? pagination.USER_LIST_LIMIT;

  // Decode cursor if provided
  let startKey;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    startKey = JSON.parse(decoded);
  }

  let result;

  if (raffleId) {
    // Query winners by raffle
    result = await winnerRepo.getByRaffle(raffleId, limit, startKey);
  } else if (payoutStatus) {
    // Query winners by payout status
    result = await winnerRepo.getByPayoutStatus(payoutStatus, limit, startKey);
  } else {
    // Default: show pending payouts (for admin dashboard)
    result = await winnerRepo.getByPayoutStatus(PayoutStatus.PENDING, limit, startKey);
  }

  return {
    winners: result.items,
    nextCursor: result.lastKey ? encodeCursor(JSON.stringify(result.lastKey)) : undefined,
    hasMore: !!result.lastKey,
  };
}

/**
 * List raffles with optional filtering and pagination
 */
export async function listRaffles(params: ListRafflesParams = {}): Promise<PaginatedRaffles> {
  const { status, type, cursor } = params;
  const limit: number = params.limit ?? pagination.DEFAULT_LIMIT;

  // Decode cursor if provided
  let startKey;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    startKey = JSON.parse(decoded);
  }

  let result;
  const queryLimit: number = limit;

  if (status) {
    result = await raffleRepo.getByStatus(status, queryLimit, startKey);
  } else if (type) {
    result = await raffleRepo.getByType(type, queryLimit, startKey);
  } else {
    // Get all active raffles by default
    result = await raffleRepo.getByStatus('active', queryLimit, startKey);
  }

  // Enrich all raffles with displayStatus
  const enrichedRaffles = result.items.map((raffle) => ({
    ...raffle,
    displayStatus: computeDisplayStatus(raffle),
  }));

  return {
    raffles: enrichedRaffles,
    nextCursor: result.lastKey ? JSON.stringify(result.lastKey) : undefined,
    hasMore: !!result.lastKey,
  };
}
