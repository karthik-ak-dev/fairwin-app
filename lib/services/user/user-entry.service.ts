/**
 * User Entry Service
 *
 * Handles user entry history and enrichment with raffle details.
 */

import { entryRepo } from '@/lib/db/repositories';
import { raffleRepo } from '@/lib/db/repositories';
import type { EnrichedEntry, EnrichedEntryList, PaginationParams } from '../types';
import { validateWalletAddress } from '../shared/validation.service';
import { CacheService } from '../shared/cache.service';
import { encodeCursor, decodeCursor } from '../shared/pagination.service';
import { pagination } from '@/lib/constants';

// Cache for raffle lookups (5 minute TTL)
const raffleCache = new CacheService<string, { title: string; type: string; status: string }>();

/**
 * Get user's entries with raffle details
 *
 * Enriches entries with raffle info (title, type, status)
 * Uses cache to batch raffle lookups and avoid N+1 queries
 */
export async function getUserEntriesEnriched(
  walletAddress: string,
  params: PaginationParams = {}
): Promise<EnrichedEntryList> {
  validateWalletAddress(walletAddress);

  const { limit = pagination.DEFAULT_LIMIT, cursor } = params;

  // Get user entries
  let startKey;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    startKey = JSON.parse(decoded);
  }

  const entriesResult = await entryRepo.getByUser(walletAddress, limit, startKey);
  const entries = entriesResult.items;

  // Get unique raffle IDs
  const raffleIdSet = new Set(entries.map((e) => e.raffleId));
  const raffleIds = Array.from(raffleIdSet);

  // Batch fetch raffle details with cache
  const raffleDetails = await raffleCache.batchGet(
    raffleIds,
    async (ids) => {
      const raffles = await Promise.all(ids.map((id) => raffleRepo.getById(id)));
      const result = new Map();
      raffles.forEach((r) => {
        if (r) {
          result.set(r.raffleId, {
            title: r.title,
            type: r.type,
            status: r.status,
          });
        }
      });
      return result;
    }
  );

  // Enrich entries with raffle details
  const enrichedEntries: EnrichedEntry[] = entries.map((entry) => {
    const raffle = raffleDetails.get(entry.raffleId);
    return {
      entryId: entry.entryId,
      raffleId: entry.raffleId,
      raffleTitle: raffle?.title || 'Unknown',
      raffleType: raffle?.type || 'unknown',
      raffleStatus: raffle?.status || 'unknown',
      numEntries: entry.numEntries,
      totalPaid: entry.totalPaid,
      timestamp: new Date(entry.createdAt).getTime(),
      transactionHash: entry.transactionHash,
    };
  });

  // Build next cursor
  const nextCursor = entriesResult.lastKey
    ? encodeCursor(JSON.stringify(entriesResult.lastKey))
    : undefined;

  return {
    entries: enrichedEntries,
    hasMore: !!entriesResult.lastKey,
    nextCursor,
  };
}
