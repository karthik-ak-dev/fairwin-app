/**
 * Raffle Query Service
 *
 * Handles complex raffle queries and data enrichment.
 * Enriches all raffle data with displayStatus computed from contractState.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import type {
  EnrichedRaffle,
  ListRafflesParams,
  PaginatedRaffles,
  RaffleStats,
} from '../types';
import { RaffleNotFoundError } from '../errors';
import { getUserEntryCount } from './raffle-entry.service';
import { aggregateParticipants } from './raffle-participant.service';
import { decodeCursor } from '../shared/pagination.service';
import { computeDisplayStatus } from './raffle-status.service';

/**
 * Get raffle with enriched data
 *
 * Includes:
 * - Raffle details
 * - Recent entries (last 10)
 * - Winners (if completed)
 * - User-specific data (if wallet provided)
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
  const entriesResult = await entryRepo.getByRaffle(raffleId, 10);
  const recentEntries = entriesResult.items;

  // Get winners if completed
  let winners: any[] = [];
  if (raffle.status === 'completed') {
    const winnersResult = await winnerRepo.getByRaffle(raffleId);
    winners = winnersResult.items;
  }

  // Get user-specific data if wallet provided
  let userStats;
  if (walletAddress) {
    const entryCount = await getUserEntryCount(raffleId, walletAddress);
    const userEntriesResult = await entryRepo.getUserEntriesForRaffle(walletAddress, raffleId);
    const totalSpent = userEntriesResult.reduce((sum, e) => sum + e.totalPaid, 0);

    // Calculate rank by getting all participants sorted by entry count
    const participantsResult = await aggregateParticipants(raffleId);
    const userRank = participantsResult.participants.findIndex(
      (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    ) + 1;

    userStats = {
      entries: entryCount,
      totalSpent,
      rank: userRank > 0 ? userRank : 0,
    };
  }

  // Enrich raffle with displayStatus
  const displayStatus = computeDisplayStatus(raffle);

  return {
    raffle: {
      ...raffle,
      displayStatus, // Add computed display status for UI
    },
    recentEntries,
    winners,
    userStats,
  };
}

/**
 * List raffles with optional filtering and pagination
 */
export async function listRaffles(params: ListRafflesParams = {}): Promise<PaginatedRaffles> {
  const { status, type, limit = 20, cursor } = params;

  // Decode cursor if provided
  let startKey;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    startKey = JSON.parse(decoded);
  }

  let result;

  if (status) {
    result = await raffleRepo.getByStatus(status, limit, startKey);
  } else if (type) {
    result = await raffleRepo.getByType(type, limit, startKey);
  } else {
    // Get all active raffles by default
    result = await raffleRepo.getByStatus('active', limit, startKey);
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

/**
 * Get raffle statistics
 */
export async function getRaffleStats(raffleId: string): Promise<RaffleStats> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  // Calculate unique participants
  const uniqueParticipants = new Set(entries.map((e) => e.walletAddress)).size;

  // Calculate average entries per user
  const avgEntriesPerUser =
    uniqueParticipants > 0 ? raffle.totalEntries / uniqueParticipants : 0;

  // Compute display status
  const displayStatus = computeDisplayStatus(raffle);

  return {
    raffleId,
    totalEntries: raffle.totalEntries,
    totalParticipants: raffle.totalParticipants,
    prizePool: raffle.prizePool,
    status: raffle.status, // Keep original status field
    contractState: raffle.contractState, // Include blockchain state
    displayStatus, // Add computed display status
    entryPrice: raffle.entryPrice,
    maxEntriesPerUser: raffle.maxEntriesPerUser,
    avgEntriesPerUser: Math.round(avgEntriesPerUser * 100) / 100,
  };
}
