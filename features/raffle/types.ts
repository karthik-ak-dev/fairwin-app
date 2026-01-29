// ============================================================================
// Raffle Feature — Type Definitions
// ============================================================================

/** Lifecycle states a raffle can be in */
export type RaffleState =
  | 'active'
  | 'ending'
  | 'drawing'
  | 'ended'
  | 'cancelled'
  | 'scheduled';

/** Categories of raffles by frequency / special event */
export type RaffleType = 'daily' | 'weekly' | 'monthly' | 'flash' | 'mega';

/** A single prize tier within a raffle */
export interface PrizeTier {
  /** Display name, e.g. "Grand Prize" */
  name: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Percentage of the total prize pool allocated to this tier */
  percentage: number;
  /** Number of winners in this tier */
  winnersCount: number;
  /** Amount each winner in this tier receives */
  amountPerWinner: number;
  /** Tailwind color class for UI rendering */
  colorClass: string;
}

/** A winner record */
export interface Winner {
  /** Wallet address of the winner */
  address: string;
  /** Prize amount (in native token) */
  prize: number;
  /** Tier name this winner belongs to */
  tier: string;
  /** On-chain transaction hash of the payout */
  txHash: string;
  /** The winning ticket number */
  ticketNumber: number;
  /** Total tickets in the draw */
  totalTickets: number;
}

/** Full raffle entity */
export interface Raffle {
  /** Unique identifier */
  id: string;
  /** Sequential raffle number for display */
  raffleNumber: number;
  /** Type / frequency category */
  type: RaffleType;
  /** Current lifecycle state */
  state: RaffleState;
  /** Human-readable title */
  title: string;
  /** Cost per single entry (in native token) */
  entryPrice: number;
  /** Total number of entries purchased */
  totalEntries: number;
  /** Unique participants count */
  totalParticipants: number;
  /** Current prize pool value */
  prizePool: number;
  /** Total winners to be drawn */
  winnersCount: number;
  /** Max entries a single wallet can purchase */
  maxEntriesPerUser: number;
  /** ISO-8601 start timestamp */
  startTime: string;
  /** ISO-8601 end timestamp */
  endTime: string;
  /** On-chain contract address */
  contractAddress: string;
  /** Prize tier breakdown */
  prizeTiers: PrizeTier[];
  /** Winner info (populated after draw) */
  winner?: Winner;
  /** ISO-8601 creation timestamp */
  createdAt: string;
}

/** A single entry (ticket purchase) record */
export interface Entry {
  /** Unique entry id */
  id: string;
  /** Associated raffle id */
  raffleId: string;
  /** Wallet address that purchased */
  address: string;
  /** Number of entries bought in this transaction */
  entriesCount: number;
  /** Total amount paid */
  totalAmount: number;
  /** ISO-8601 timestamp of purchase */
  timestamp: string;
  /** On-chain transaction hash */
  txHash: string;
}
