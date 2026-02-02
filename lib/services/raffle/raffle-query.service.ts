/**
 * Raffle Query Service
 *
 * Handles complex raffle queries and data enrichment.
 * Provides comprehensive raffle data with computed display status.
 */

import { raffleRepo } from '@/lib/db/repositories';
import { entryRepo } from '@/lib/db/repositories';
import { winnerRepo } from '@/lib/db/repositories';
import { RaffleStatus } from '@/lib/db/models';
import type {
  EnrichedRaffle,
  ListRafflesParams,
  PaginatedRaffles,
  RaffleStats,
} from '../types';
import { RaffleNotFoundError } from '../errors';
import { decodeCursor } from '../shared/pagination.service';
import { computeDisplayStatus } from './raffle-status.service';
import { pagination } from '@/lib/constants';

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
  const recentEntriesLimit = 10;
  const entriesResult = await entryRepo.getByRaffle(raffleId, recentEntriesLimit);
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
    status: raffle.status,
    displayStatus,
    entryPrice: raffle.entryPrice,
    avgEntriesPerUser: Math.round(avgEntriesPerUser * 100) / 100,
  };
}
