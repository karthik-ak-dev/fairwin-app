/**
 * Raffle Service Types
 *
 * All types related to raffle operations including:
 * - Entry management
 * - Draw/winner selection
 * - Payouts and refunds
 * - Raffle queries
 */

import type {
  RaffleItem,
  EntryItem,
  WinnerItem,
  RaffleStatus,
  RaffleType,
  PayoutStatus as PayoutStatusEnum,
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

export interface Ticket {
  ticketNumber: number;
  walletAddress: string;
  entryId: string;
}

export interface SelectedWinner {
  walletAddress: string;
  ticketNumber: number;
  totalTickets: number;
  prize: number;
  tier: string;
  position: number;
}

export interface DrawInitiationResult {
  raffleId: string;
  winners: SelectedWinner[];
  randomSeed: string;
  blockHash?: string;
  status: 'completed';
  timestamp: number;
}

export interface WinnerSelectionResult {
  winners: SelectedWinner[];
  randomSeed: string;
  totalTickets: number;
  totalPrize: number;
  blockNumber?: bigint | number;
  blockHash?: string;
}

export interface PrizeTierConfig {
  name: string;
  percentage: number;
  winnerCount: number;
}

// ============================================================================
// Raffle Query Types
// ============================================================================

export type DisplayStatus = 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

export interface EnrichedRaffle {
  raffle: RaffleItem & { displayStatus?: DisplayStatus };
  recentEntries: EntryItem[];
  winners?: WinnerItem[];
  userStats?: {
    entries: number;
    totalSpent: number;
  };
}

export interface ListRafflesParams {
  status?: RaffleStatus;
  type?: RaffleType;
  limit?: number;
  cursor?: string;
}

export interface PaginatedRaffles {
  raffles: (RaffleItem & { displayStatus?: DisplayStatus })[];
  nextCursor?: string;
  hasMore: boolean;
}


// ============================================================================
// Payout Types
// ============================================================================

export interface PayoutResult {
  winnerId: string;
  walletAddress: string;
  amount: number;
  status: PayoutStatusEnum;
  transactionHash: string;
  error?: string;
}

export interface BatchPayoutResult {
  raffleId: string;
  totalWinners: number;
  successful: number;
  failed: number;
  payouts: PayoutResult[];
}

export interface RefundResult {
  entryId: string;
  walletAddress: string;
  amount: number;
  transactionHash: string;
  status: string;
  error?: string;
}

export interface BatchRefundResult {
  raffleId: string;
  totalEntries: number;
  successful: number;
  failed: number;
  refunds: RefundResult[];
}

// ============================================================================
// Raffle Creation/Update Types
// ============================================================================

export interface CreateRaffleParams {
  type: RaffleType;
  title: string;
  description?: string;
  entryPrice: number;
  startTime: number;
  endTime: number;
  winnerCount?: number;
  platformFeePercent?: number;
  prizeTiers?: PrizeTierConfig[];
}

export interface UpdateRaffleParams {
  title?: string;
  description?: string;
  entryPrice?: number;
  startTime?: number;
  endTime?: number;
  winnerCount?: number;
  status?: RaffleStatus;
}
