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
import { RaffleStatus } from '@/lib/db/models';
import type { RaffleItem } from '@/lib/db/models';
import type {
  EnrichedRaffle,
  ListRafflesParams,
  PaginatedRaffles,
  RaffleStats,
} from '../types';
import { RaffleNotFoundError } from '../errors';
import { decodeCursor } from '../shared/pagination.service';
import { pagination, auth } from '@/lib/constants';

// ============================================================================
// Display Status Types & Computation
// ============================================================================

/**
 * Display status type - what users see in the UI
 *
 * - scheduled: Raffle created but not started yet
 * - active: Raffle accepting entries
 * - ending: Less than 5 minutes until endTime (urgency indicator)
 * - drawing: Backend selecting winners
 * - completed: Winners selected, payouts pending/processed
 * - cancelled: Raffle cancelled, refunds available
 */
export type DisplayStatus = 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

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
    return 'drawing';
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  // Before start time → show as scheduled
  if (now < startTime) {
    return 'scheduled';
  }

  // Less than 5 minutes until end → show urgency
  const ENDING_THRESHOLD = auth.CHALLENGE_EXPIRATION_MS; // 5 minutes in milliseconds
  if (raffle.status === RaffleStatus.ACTIVE && endTime - now <= ENDING_THRESHOLD && now < endTime) {
    return 'ending';
  }

  // Otherwise, display status matches base status
  return raffle.status;
}

/**
 * Check if raffle is accepting entries
 *
 * A raffle accepts entries when:
 * - Status is 'active'
 * - Current time is between startTime and endTime
 */
export function isAcceptingEntries(raffle: Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>): boolean {
  if (raffle.status !== RaffleStatus.ACTIVE) {
    return false;
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  return now >= startTime && now < endTime;
}

/**
 * Check if raffle can be drawn
 *
 * A raffle can be drawn when:
 * - Status is 'active'
 * - Current time is past endTime
 * - Raffle hasn't been drawn yet
 */
export function canBeDrawn(raffle: Pick<RaffleItem, 'status' | 'endTime'>): boolean {
  if (raffle.status !== RaffleStatus.ACTIVE) {
    return false;
  }

  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();

  return now >= endTime;
}

/**
 * Check if raffle is finalized (completed or cancelled)
 */
export function isFinalized(raffle: Pick<RaffleItem, 'status'>): boolean {
  return raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED;
}

/**
 * Get time until raffle starts (in milliseconds)
 */
export function timeUntilStart(raffle: Pick<RaffleItem, 'startTime'>): number {
  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  return Math.max(0, startTime - now);
}

/**
 * Get time until raffle ends (in milliseconds)
 */
export function timeUntilEnd(raffle: Pick<RaffleItem, 'endTime'>): number {
  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();
  return Math.max(0, endTime - now);
}

/**
 * Get time remaining as human-readable string
 *
 * @param milliseconds Time in milliseconds
 * @returns Human-readable string (e.g., "2h 30m", "45m", "30s")
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Ended';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Enrich raffle with computed display status
 *
 * Adds displayStatus field to raffle object.
 * Useful for API responses.
 */
export function enrichWithDisplayStatus<T extends Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>>(
  raffle: T
): T & { displayStatus: DisplayStatus } {
  return {
    ...raffle,
    displayStatus: computeDisplayStatus(raffle),
  };
}

/**
 * Enrich multiple raffles with display status
 */
export function enrichManyWithDisplayStatus<T extends Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>>(
  raffles: T[]
): Array<T & { displayStatus: DisplayStatus }> {
  return raffles.map(enrichWithDisplayStatus);
}

// ============================================================================
// Raffle Query Operations
// ============================================================================

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
