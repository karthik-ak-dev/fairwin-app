// ============================================================================
// Admin Feature — Type Definitions
// ============================================================================

import type { Raffle } from '../raffle/types';

/** Aggregated statistics for the admin dashboard */
export interface AdminStats {
  /** Total revenue collected across all raffles */
  totalRevenue: number;
  /** Revenue collected in the current calendar month */
  revenueThisMonth: number;
  /** Number of currently active raffles */
  activeRaffles: number;
  /** Total entries sold across all raffles */
  totalEntries: number;
  /** Total unique users (wallets) */
  totalUsers: number;
  /** Average prize pool size across completed raffles */
  avgPoolSize: number;
}

/** Extended raffle entity with admin-only fields */
export interface AdminRaffle extends Raffle {
  /** Operator fee percentage taken from prize pool */
  operatorFee: number;
  /** Internal status string for admin tracking */
  status: string;
}

/** A payout record for a raffle winner */
export interface Payout {
  /** Unique payout id */
  id: string;
  /** Associated raffle id */
  raffleId: string;
  /** Title of the raffle */
  raffleTitle: string;
  /** Raffle type as string */
  raffleType: string;
  /** Winner's wallet address */
  winnerAddress: string;
  /** Prize amount (native token) */
  prize: number;
  /** Payout status */
  status: 'paid' | 'pending' | 'failed';
  /** On-chain transaction hash (present when paid) */
  txHash?: string;
  /** ISO-8601 timestamp */
  timestamp: string;
}

/** Operator wallet balances */
export interface WalletBalance {
  /** MATIC balance */
  matic: number;
  /** MATIC value in USD */
  maticUsd: number;
  /** USDC balance */
  usdc: number;
  /** LINK balance */
  link: number;
  /** LINK value in USD */
  linkUsd: number;
}

/** A transaction record for the operator wallet */
export interface Transaction {
  /** Transaction type label (e.g. "Entry Fee", "Payout") */
  type: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Display amount string (e.g. "+2.5 MATIC") */
  amount: string;
  /** Whether funds were received (true) or sent (false) */
  isIncoming: boolean;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** On-chain transaction hash */
  txHash: string;
}
