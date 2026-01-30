/**
 * Raffle Participant Service
 *
 * Handles participant aggregation and leaderboard functionality.
 */

import { entryRepo } from '@/lib/db/repositories';
import type { Participant, ParticipantList, PaginationParams } from '../types';
import { decodeCursor, encodeCursor } from '../shared/pagination.service';

/**
 * Aggregate participants for a raffle
 *
 * Deduplicates entries by wallet address and aggregates:
 * - Total entries per participant
 * - Total amount spent
 * - Entry timestamps
 *
 * Returns sorted by entry count (descending)
 */
export async function aggregateParticipants(
  raffleId: string,
  params: PaginationParams = {}
): Promise<ParticipantList> {
  const { limit = 50, cursor } = params;

  // Get all entries for raffle
  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  // Aggregate by wallet address
  const participantMap = new Map<string, Participant>();

  for (const entry of entries) {
    const existing = participantMap.get(entry.walletAddress);
    const entryTimestamp = new Date(entry.createdAt).getTime();

    if (existing) {
      existing.numEntries += entry.numEntries;
      existing.totalPaid += entry.totalPaid;
      existing.lastEntryAt = Math.max(existing.lastEntryAt, entryTimestamp);
      existing.firstEntryAt = Math.min(existing.firstEntryAt, entryTimestamp);
    } else {
      participantMap.set(entry.walletAddress, {
        walletAddress: entry.walletAddress,
        numEntries: entry.numEntries,
        totalPaid: entry.totalPaid,
        firstEntryAt: entryTimestamp,
        lastEntryAt: entryTimestamp,
      });
    }
  }

  // Convert to array and sort by entry count
  let participants = Array.from(participantMap.values()).sort(
    (a, b) => b.numEntries - a.numEntries
  );

  // Apply pagination
  let startIndex = 0;
  if (cursor) {
    const decodedWallet = decodeCursor(cursor);
    startIndex = participants.findIndex((p) => p.walletAddress === decodedWallet);
    if (startIndex === -1) {
      startIndex = 0;
    } else {
      startIndex += 1; // Start after cursor
    }
  }

  const paginatedItems = participants.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < participants.length;
  const nextCursor = hasMore
    ? encodeCursor(paginatedItems[paginatedItems.length - 1].walletAddress)
    : undefined;

  return {
    participants: paginatedItems,
    totalParticipants: participants.length,
    hasMore,
    nextCursor,
  };
}
