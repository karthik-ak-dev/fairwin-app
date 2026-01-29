/**
 * Raffle Model - Raffle Game Specific
 *
 * Represents a single raffle instance where users can buy entries for a chance to win prizes.
 * Raffles use Chainlink VRF for provably fair, on-chain random winner selection.
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
 * 4. drawing → VRF request sent, waiting for random number
 * 5. completed → Winners selected, payouts processed
 * 6. cancelled → Admin cancelled (rare, refunds issued)
 *
 * Use Cases:
 * - Raffle listing page (filter by status/type)
 * - Individual raffle detail page
 * - Admin raffle management
 * - VRF draw triggering
 */
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
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';

  /**
   * Current lifecycle status of the raffle
   * Determines which operations are allowed
   *
   * - scheduled: Created but not started yet
   * - active: Accepting entries (current time >= startTime)
   * - ending: Less than 5 min until endTime (urgency indicator)
   * - drawing: VRF request sent, awaiting random number
   * - completed: Draw complete, winners selected
   * - cancelled: Admin cancelled, refunds processed
   */
  status: 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

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
   * Maximum entries a single user can purchase
   * Prevents whales from dominating the raffle
   * Typical range: 10-100 entries
   * 0 = unlimited (not recommended)
   */
  maxEntriesPerUser: number;

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
   * ISO 8601 timestamp when VRF draw was initiated (optional)
   * Set when admin triggers draw or automated scheduler runs
   * Used to track draw latency
   */
  drawTime?: string;

  /**
   * Chainlink VRF request ID (optional)
   * Unique identifier for the random number request
   * Example: "0x1234...abcd" (bytes32 hex string)
   * Used to track VRF fulfillment
   */
  vrfRequestId?: string;

  /**
   * Random word returned by Chainlink VRF (optional)
   * Example: "12345678901234567890" (uint256 as string)
   * Used to deterministically select winners
   * Stored for transparency and verification
   */
  vrfRandomWord?: string;

  /**
   * Smart contract address managing this raffle
   * Example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
   * Used for on-chain verification and interaction
   */
  contractAddress: string;

  /**
   * Transaction hash of raffle creation (optional)
   * Example: "0xabcd...1234"
   * Links to Polygonscan for transparency
   */
  transactionHash?: string;

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
 *   maxEntriesPerUser: 50,
 *   startTime: '2025-01-29T00:00:00Z',
 *   endTime: '2025-01-29T23:59:59Z'
 * });
 * ```
 */
export type CreateRaffleInput = Pick<
  RaffleItem,
  'type' | 'title' | 'description' | 'entryPrice' | 'maxEntriesPerUser' | 'startTime' | 'endTime'
>;
