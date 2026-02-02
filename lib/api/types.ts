/**
 * API Response Types
 * Types for data returned from API endpoints
 */

import type { RaffleType, UserItem, WinnerItem, EntryItem, RaffleItem } from '@/lib/db/models';

// Re-export types from models for convenience
export type { RaffleType, UserItem, WinnerItem, EntryItem, RaffleItem };

// =============================================================================
// User / Account API Response Types
// =============================================================================

/**
 * User entry status (frontend perspective)
 */
export type UserEntryStatus = 'active' | 'won' | 'lost';

/**
 * User entry display type (combines EntryItem + RaffleItem data)
 * Returned by GET /api/user/entries
 */
export interface UserEntry {
  id: string;
  raffleId: string;
  raffleTitle: string;
  raffleType: RaffleType;
  entriesCount: number;
  totalAmount: number;
  status: UserEntryStatus;
  prizeWon?: number;
  txHash: string;
  timestamp: string;
}

/**
 * User profile response
 * Returned by GET /api/user
 */
export interface UserProfileResponse {
  user: UserItem;
}

/**
 * User entries response
 * Returned by GET /api/user/entries
 */
export interface UserEntriesResponse {
  entries: UserEntry[];
  nextCursor?: string;
}

/**
 * User wins response
 * Returned by GET /api/user/wins
 */
export interface UserWinsResponse {
  wins: WinnerItem[];
  nextCursor?: string;
}

// =============================================================================
// Admin API Response Types
// =============================================================================

/**
 * Admin stats aggregation
 * Returned by GET /api/admin/stats
 */
export interface AdminStats {
  activeRaffles: number;
  avgPoolSize: number;
  revenueThisMonth: number;
  totalEntries: number;
  totalRevenue: number;
  totalUsers: number;
}

// =============================================================================
// Raffle API Response Types
// =============================================================================

/**
 * Raffle list response
 * Returned by GET /api/raffles
 */
export interface RafflesResponse {
  raffles: RaffleItem[];
  nextCursor?: string;
}

/**
 * Single raffle response
 * Returned by GET /api/raffles/[id]
 */
export interface RaffleResponse {
  raffle: RaffleItem;
  recentEntries?: EntryItem[];
  winners?: WinnerItem[];
}
