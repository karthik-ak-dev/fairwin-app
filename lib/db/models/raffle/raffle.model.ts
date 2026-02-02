/**
 * Raffle Model - Raffle Game Specific
 *
 * Represents a single raffle instance where users can buy entries for a chance to win prizes.
 * Winners are selected by the backend using cryptographically secure randomness from Polygon
 * block hashes, ensuring fairness while maintaining instant draw speed.
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Raffles
 * Primary Key: raffleId (HASH)
 * GSI1: status-endTime-index (status + endTime) - Query raffles by status
 * GSI2: type-createdAt-index (type + createdAt) - Query raffles by type
 *
 * Lifecycle:
 * 1. scheduled → Admin creates raffle, not yet accepting entries
 * 2. active → Accepting entries, users can buy tickets
 * 3. ending → Less than 5 minutes until endTime (urgency UI)
 * 4. drawing → Backend selecting winners (instant, <1 second)
 * 5. completed → Winners selected, payouts may be pending
 * 6. cancelled → Admin cancelled (rare, refunds issued)
 *
 * Use Cases:
 * - Raffle listing page (filter by status/type)
 * - Individual raffle detail page
 * - Admin raffle management
 * - Backend winner selection
 */

/**
 * Raffle Status Enum
 * Represents the lifecycle state of a raffle
 */
export enum RaffleStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDING = 'ending',
  DRAWING = 'drawing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Raffle Type Enum
 * Represents the frequency/category of a raffle
 */
export enum RaffleType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  FLASH = 'flash',
  MEGA = 'mega',
}

export interface RaffleItem {
  /**
   * Unique identifier for this raffle (Primary Key)
   * Generated as UUID v4
   * Example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   */
  raffleId: string;

  /**
   * Raffle frequency/type
   * Determines prize pool size and duration
   *
   * - daily: Runs every day, smaller prizes
   * - weekly: Runs weekly, medium prizes
   * - monthly: Runs monthly, larger prizes
   * - flash: Short duration (1-4 hours), quick games
   * - mega: Special events, massive prize pools
   */
  type: RaffleType;

  /**
   * Raffle status (backend-controlled)
   *
   * - scheduled: Admin created raffle, not yet accepting entries
   * - active: Accepting entries, users can buy tickets
   * - ending: Less than 5 minutes until endTime (urgency UI)
   * - drawing: Winners being selected (momentary state)
   * - completed: Winners selected, payouts may be pending/in-progress
   * - cancelled: Admin cancelled (refunds issued if needed)
   *
   * Status Transitions:
   * - scheduled → active (when startTime is reached)
   * - active → ending (when less than 5min until endTime)
   * - ending → drawing (when admin triggers draw)
   * - drawing → completed (when winners are selected)
   * - active/ending → cancelled (admin cancels)
   */
  status: RaffleStatus;

  /**
   * Display title for the raffle
   * Example: "Daily Raffle - January 29th"
   * Max 100 characters recommended
   */
  title: string;

  /**
   * Optional description explaining prize tiers, rules, etc.
   * Supports markdown for rich formatting
   * Example: "Win up to 1000 USDC! 1st: 500, 2nd: 300, 3rd: 200"
   */
  description: string;

  /**
   * Price per entry in USDC (smallest unit, 6 decimals)
   * Example: 1000000 = 1 USDC
   * Common values: 1, 5, 10, 25, 50, 100 USDC
   */
  entryPrice: number;

  /**
   * Total number of entries purchased across all users
   * Incremented on each entry transaction
   * Used to calculate prize pool and determine winners
   * Sum of all Entry.numEntries for this raffle
   */
  totalEntries: number;

  /**
   * Total number of unique participants (wallet addresses)
   * Incremented when a new user enters this raffle
   * Used for analytics and display
   */
  totalParticipants: number;

  /**
   * Current prize pool in USDC (smallest unit)
   * Calculated as: totalEntries * entryPrice
   * Split into protocolFee (10%) and winnerPayout (90%)
   * Grows as more users enter
   */
  prizePool: number;

  /**
   * Platform fee in USDC (smallest unit)
   * Calculated as: prizePool * protocolFeePercent (typically 10%)
   * Example: If prizePool = 1000 USDC, protocolFee = 100 USDC
   * Goes to platform treasury
   */
  protocolFee: number;

  /**
   * Amount distributed to winners in USDC (smallest unit)
   * Calculated as: prizePool - protocolFee (typically 90%)
   * Example: If prizePool = 1000 USDC, winnerPayout = 900 USDC
   * Split among winners based on prize tiers
   */
  winnerPayout: number;

  /**
   * Number of winners to be selected for this raffle
   * Determines how many participants will receive prizes
   * Max 100 winners per raffle (capped)
   * Prize pool is divided among winners according to prize tiers
   */
  winnerCount: number;

  /**
   * Platform fee percentage (0-100)
   * Percentage of prize pool taken as platform fee
   * Default: 5% (configured in constants)
   * Example: 5 = 5% fee
   */
  platformFeePercent: number;

  /**
   * Prize tier configuration
   * Defines how the prize pool is split among winner tiers
   * Each tier specifies percentage, winner count, and name
   * Must sum to 100% and match winnerCount
   *
   * Example (default 3-tier system):
   * [
   *   { name: "Tier 1", percentage: 40, winnerCount: 1 },
   *   { name: "Tier 2", percentage: 30, winnerCount: 4 },
   *   { name: "Tier 3", percentage: 30, winnerCount: 95 }
   * ]
   */
  prizeTiers: Array<{
    name: string;
    percentage: number;
    winnerCount: number;
  }>;

  /**
   * ISO 8601 timestamp when raffle starts accepting entries
   * Example: "2025-01-29T00:00:00.000Z"
   * Status changes from scheduled → active at this time
   */
  startTime: string;

  /**
   * ISO 8601 timestamp when raffle stops accepting entries
   * Example: "2025-01-29T23:59:59.999Z"
   * Draw is triggered shortly after this time
   */
  endTime: string;

  /**
   * ISO 8601 timestamp when draw was initiated (optional)
   * Set when admin triggers draw
   * Used to track how long the draw process takes
   */
  drawTime?: string;

  /**
   * Random seed used for winner selection (optional)
   * Stored as hex string for transparency and verification
   * Example: "0x1a2b3c4d..." (from block hash or crypto.randomBytes)
   * Anyone can verify winners by re-running selection with this seed
   */
  randomSeed?: string;

  /**
   * ISO 8601 timestamp of when raffle was created
   * Set once on creation, never updated
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last raffle update
   * Updated whenever any field changes
   * Useful for cache invalidation
   */
  updatedAt: string;
}

/**
 * Input type for creating a new raffle
 *
 * Only requires essential fields - other fields are calculated or set automatically:
 * - raffleId: Generated as UUID
 * - status: Defaults to 'scheduled'
 * - totalEntries, totalParticipants: Start at 0
 * - prizePool, protocolFee, winnerPayout: Start at 0, grow with entries
 * - createdAt, updatedAt: Set to current time
 *
 * Example Usage:
 * ```typescript
 * await raffleRepo.create({
 *   type: 'daily',
 *   title: 'Daily Raffle - Jan 29',
 *   description: 'Win up to 1000 USDC!',
 *   entryPrice: 1000000, // 1 USDC
 *   winnerCount: 1,
 *   startTime: '2025-01-29T00:00:00Z',
 *   endTime: '2025-01-29T23:59:59Z'
 * });
 * ```
 */
export type CreateRaffleInput = Pick<
  RaffleItem,
  | 'type'
  | 'title'
  | 'description'
  | 'entryPrice'
  | 'winnerCount'
  | 'startTime'
  | 'endTime'
> & {
  platformFeePercent?: number;
  prizeTiers?: Array<{
    name: string;
    percentage: number;
    winnerCount: number;
  }>;
};
