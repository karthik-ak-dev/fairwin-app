/**
 * User Service Types
 *
 * All types related to user operations including:
 * - User profiles and stats
 * - User entries
 * - User participation history
 */

import type { UserItem } from '@/lib/db/models';

// ============================================================================
// User Entry Types
// ============================================================================

export interface EnrichedEntry {
  entryId: string;
  raffleId: string;
  raffleTitle: string;
  raffleType: string;
  raffleStatus: string;
  numEntries: number;
  totalPaid: number;
  timestamp: number;
  transactionHash: string;
}

export interface EnrichedEntryList {
  entries: EnrichedEntry[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// User Stats Types
// ============================================================================

export interface UserSummary {
  user: UserItem;
  stats: {
    totalRafflesEntered: number;
    totalEntriesMade: number;
    totalSpent: number;
    totalWon: number;
    winRate: number;
    activeEntries: number;
  };
}

export interface ParticipationStats {
  totalRaffles: number;
  totalEntries: number;
  totalSpent: number;
  activeRaffles: number;
  completedRaffles: number;
  winCount: number;
  winRate: number;
}
