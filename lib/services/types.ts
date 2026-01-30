/**
 * Service Layer Types and DTOs
 *
 * Data Transfer Objects and shared types for service layer operations.
 */

import type {
  RaffleItem as Raffle,
  EntryItem as Entry,
  WinnerItem as Winner,
  UserItem as User,
  PayoutItem as Payout,
} from '@/lib/db/models';

// ============================================================================
// Raffle Entry Types
// ============================================================================

export interface CreateEntryParams {
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  transactionHash: string;
  blockNumber: number;
}

export interface CreateEntryResult {
  entryId: string;
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  timestamp: number;
  transactionHash: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  maxEntriesReached?: boolean;
  currentEntries?: number;
}

// ============================================================================
// Raffle Draw Types
// ============================================================================

export interface DrawInitiationResult {
  raffleId: string;
  status: 'drawing';
  vrfRequestId?: string;
  timestamp: number;
}

export interface WinnerSelectionResult {
  raffleId: string;
  winners: Winner[];
  randomNumber: string;
  timestamp: number;
}

// ============================================================================
// Raffle Query Types
// ============================================================================

export interface EnrichedRaffle {
  raffle: Raffle;
  recentEntries: Entry[];
  winners?: Winner[];
  userStats?: {
    entries: number;
    totalSpent: number;
    rank: number;
  };
}

export interface RaffleStats {
  raffleId: string;
  totalEntries: number;
  totalParticipants: number;
  prizePool: number;
  status: string;
  entryPrice: number;
  maxEntriesPerUser: number;
  avgEntriesPerUser: number;
}

export interface ListRafflesParams {
  status?: 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';
  type?: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';
  limit?: number;
  cursor?: string;
}

export interface PaginatedRaffles {
  raffles: Raffle[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Participant Types
// ============================================================================

export interface Participant {
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  firstEntryAt: number;
  lastEntryAt: number;
  rank?: number;
}

export interface ParticipantList {
  participants: Participant[];
  totalParticipants: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

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
  user: User;
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

// ============================================================================
// Admin Stats Types
// ============================================================================

export interface PlatformStats {
  totalRevenue: number;
  totalPaidOut: number;
  totalRaffles: number;
  totalEntries: number;
  totalUsers: number;
  totalWinners: number;
  activeRaffles: number;
  avgPoolSize: number;
  payoutStats: {
    pending: number;
    paid: number;
    failed: number;
    avgAmount: number;
  };
}

export interface TypeStats {
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';
  count: number;
  totalRevenue: number;
  avgPoolSize: number;
}

export interface RevenueData {
  period: string; // ISO date string
  revenue: number;
  raffleCount: number;
  entryCount: number;
}

// ============================================================================
// Payout Types
// ============================================================================

export interface PayoutResult {
  payoutId: string;
  winnerId: string;
  walletAddress: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  transactionHash?: string;
  error?: string;
  timestamp: number;
}

export interface PayoutStatus {
  raffleId: string;
  totalWinners: number;
  payoutsSummary: {
    pending: number;
    paid: number;
    failed: number;
    totalAmount: number;
    paidAmount: number;
  };
  payouts: Payout[];
}

// ============================================================================
// Blockchain Types
// ============================================================================

export interface ContractRaffle {
  raffleId: string;
  prizePool: bigint;
  totalEntries: bigint;
  status: number;
  winner?: string;
}

export interface EntryVerification {
  valid: boolean;
  raffleId?: string;
  walletAddress?: string;
  numEntries?: number;
  blockNumber?: number;
}

export interface PayoutVerification {
  valid: boolean;
  recipient?: string;
  amount?: bigint;
  blockNumber?: number;
}

export interface RequestRandomnessResult {
  requestId: string;
  transactionHash: string;
  blockNumber: number;
}

export interface PayoutTransaction {
  transactionHash: string;
  blockNumber: number;
  amount: bigint;
  recipient: string;
}

export interface TokenBalances {
  matic: bigint;
  usdc: bigint;
  link: bigint;
}

export interface WalletBalances {
  address: string;
  balances: TokenBalances;
  formatted: {
    matic: string;
    usdc: string;
    link: string;
  };
}

// ============================================================================
// Raffle Creation Types
// ============================================================================

export interface CreateRaffleParams {
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';
  title: string;
  description?: string;
  entryPrice: number;
  maxEntriesPerUser: number;
  startTime: number;
  endTime: number;
  winnerCount?: number;
  platformFeePercent?: number;
}

export interface UpdateRaffleParams {
  title?: string;
  description?: string;
  entryPrice?: number;
  maxEntriesPerUser?: number;
  startTime?: number;
  endTime?: number;
  winnerCount?: number;
  status?: 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}
