// ============================================================================
// Account Feature — Type Definitions
// ============================================================================

import type { RaffleType } from '../raffle/types';

/** Aggregated profile data for a connected wallet */
export interface UserProfile {
  /** Wallet address */
  address: string;
  /** Lifetime winnings (native token) */
  totalWon: number;
  /** Lifetime spent on entries (native token) */
  totalSpent: number;
  /** Total number of raffles entered */
  rafflesEntered: number;
  /** Win rate as a decimal (0–1) */
  winRate: number;
  /** Number of entries in currently-active raffles */
  activeEntries: number;
}

/** A user's entry in a specific raffle */
export interface UserEntry {
  /** Unique entry id */
  id: string;
  /** Associated raffle id */
  raffleId: string;
  /** Title of the raffle */
  raffleTitle: string;
  /** Raffle frequency type */
  raffleType: RaffleType;
  /** Number of entries purchased */
  entriesCount: number;
  /** Total amount paid */
  totalAmount: number;
  /** Current status of this entry */
  status: 'active' | 'won' | 'lost';
  /** Prize won (only when status = 'won') */
  prizeWon?: number;
  /** ISO-8601 timestamp of purchase */
  timestamp: string;
  /** On-chain transaction hash */
  txHash: string;
}

/** A recorded win for the user */
export interface UserWin {
  /** Unique win id */
  id: string;
  /** Associated raffle id */
  raffleId: string;
  /** Title of the raffle won */
  raffleTitle: string;
  /** Prize amount (native token) */
  prize: number;
  /** Prize tier name */
  tier: string;
  /** ISO-8601 timestamp of win */
  timestamp: string;
  /** On-chain payout transaction hash */
  txHash: string;
}
