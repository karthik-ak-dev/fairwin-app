/**
 * Payout status enum - represents the state of a winner's payment
 */
export enum PayoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  PROCESSING = 'processing',
}

/**
 * Winner Model - Raffle Game Specific
 *
 * Represents a winning entry selected after a raffle ends.
 * Each raffle can have multiple winners (1st place, 2nd place, 3rd place, etc.).
 * Winners are selected using cryptographically secure randomness.
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Winners
 * Primary Key: winnerId (HASH)
 * GSI1: raffleId-createdAt-index (raffleId + createdAt) - Get all winners for a raffle
 * GSI2: walletAddress-createdAt-index (walletAddress + createdAt) - Get all wins for a user
 *
 * Winner Selection Process:
 * 1. Raffle ends (current time > endTime)
 * 2. Admin triggers draw
 * 3. Backend generates random seed (from block hash or crypto.randomBytes)
 * 4. Seed used to deterministically select winning ticket numbers
 * 5. Winner records created for each prize tier
 * 6. Admin reviews and initiates payouts
 *
 * Use Cases:
 * - Display winners on raffle results page
 * - Show user's win history
 * - Calculate payout amounts
 * - Verify fairness (ticket selection can be reproduced with stored seed)
 * - Winners leaderboard
 */
export interface WinnerItem {
  /**
   * Unique identifier for this winner record (Primary Key)
   * Generated as UUID v4
   * Example: "w1n2n3r4-5678-90ab-cdef-1234567890ab"
   *
   * Note: One user can win multiple times across different raffles,
   * each gets a unique winnerId
   */
  winnerId: string;

  /**
   * ID of the raffle this winner belongs to
   * Foreign key to RaffleItem.raffleId
   * Used in GSI1 to query all winners for a specific raffle
   *
   * Multiple winners can have the same raffleId
   * (1st, 2nd, 3rd place winners)
   */
  raffleId: string;

  /**
   * Wallet address of the winning user
   * Format: 0x-prefixed hex string (42 characters)
   * Used in GSI2 to query all wins by a specific user
   *
   * Important: Same user can win multiple times if they bought multiple tickets
   */
  walletAddress: string;

  /**
   * The specific ticket number that won
   * Range: 1 to totalTickets
   * Selected deterministically using random seed
   *
   * Example: If totalTickets = 100, ticketNumber could be 42
   *
   * Selection algorithm:
   * Uses seeded PRNG with stored randomSeed to pick winning tickets
   * Anyone can verify by re-running selection with same seed
   *
   * This is THE winning ticket number that secured the prize
   */
  ticketNumber: number;

  /**
   * Total number of tickets sold when draw happened
   * Same as raffle.totalEntries at time of draw
   * Stored for verification and calculating odds
   *
   * Example: If 100 tickets sold and user bought 5,
   * their win probability was 5/100 = 5%
   *
   * Used to display:
   * - "You won with ticket #42 out of 100 total tickets"
   * - "Your odds were 1 in 20"
   */
  totalTickets: number;

  /**
   * Prize amount won in USDC (smallest unit)
   * Determined by prize tier and prize pool distribution
   *
   * Example prize structure for 1000 USDC prize pool (90% after fees):
   * - 1st place: 450 USDC (50% of 900)
   * - 2nd place: 270 USDC (30% of 900)
   * - 3rd place: 180 USDC (20% of 900)
   *
   * Amounts are in smallest unit: 1 USDC = 1,000,000
   */
  prize: number;

  /**
   * Prize tier identifier (flexible string for different raffle types)
   *
   * Common formats:
   * - Positional: "1st", "2nd", "3rd"
   * - Named: "grand", "runner-up", "consolation"
   * - Numbered: "winner-1", "winner-2", "winner-3"
   * - Percentage: "50%", "30%", "20%"
   *
   * Determines:
   * - Display order (1st before 2nd)
   * - Badge color (gold, silver, bronze)
   * - Celebration animations
   *
   * Not an enum to allow flexibility for different raffle types
   * (daily vs mega raffles may have different tier structures)
   */
  tier: string;

  /**
   * Payout status for this winner
   *
   * - pending: Winner selected but payout not yet sent
   * - processing: Transaction submitted to blockchain
   * - paid: USDC sent to winner's wallet
   * - failed: Payout attempt failed (retry needed)
   *
   * Transitions:
   * - pending → processing (when admin initiates payout)
   * - processing → paid (when transaction confirms)
   * - processing → failed (if transaction fails)
   * - failed → processing (when retrying)
   */
  payoutStatus: PayoutStatus;

  /**
   * Polygon transaction hash of payout (optional)
   * Set when payout is processed and sent to winner
   * Example: "0xpay0ut...hash1234"
   *
   * Used for:
   * - Proof of payment
   * - Link to block explorer (Polygonscan)
   * - Verify payout was sent
   * - Reconciliation
   *
   * Remains undefined until payoutStatus = 'paid'
   */
  payoutTransactionHash?: string;

  /**
   * ISO 8601 timestamp when payout was successfully processed (optional)
   * Set only when status transitions to 'paid'
   * Example: "2025-01-30T00:05:30.123Z"
   *
   * Used to calculate:
   * - Payout processing time (payoutProcessedAt - createdAt)
   * - Average payout latency
   * - SLA compliance
   *
   * Remains undefined if payoutStatus='pending' or 'failed'
   */
  payoutProcessedAt?: string;

  /**
   * Error message if payout failed (optional)
   * Contains reason why transaction failed
   * Examples:
   * - "Insufficient balance"
   * - "Transaction reverted"
   * - "Invalid recipient address"
   * - "Gas estimation failed"
   *
   * Only set when payoutStatus='failed'
   * Used for debugging and retry logic
   */
  payoutError?: string;

  /**
   * ISO 8601 timestamp when winner was selected
   * Example: "2025-01-29T23:59:59.999Z"
   *
   * Usually matches raffle.drawTime
   * Used in both GSIs as sort key for chronological ordering
   *
   * Important for:
   * - Displaying recent wins first
   * - Win analytics over time
   * - Leaderboards (most recent winners)
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last winner/payout update
   * Updated whenever payoutStatus, error, or transactionHash changes
   *
   * Useful for:
   * - Monitoring stale pending payouts
   * - Retry scheduling
   * - Change tracking
   */
  updatedAt: string;
}

/**
 * Input type for creating a new winner
 *
 * Called after backend selects winners using random seed.
 * Only requires fields from selection result - other fields are generated:
 * - winnerId: Generated as UUID
 * - payoutStatus: Defaults to 'pending'
 * - payoutTransactionHash: Set later when payout is sent
 * - payoutProcessedAt: Set when payout completes
 * - payoutError: Set if payout fails
 * - createdAt: Set to current time
 * - updatedAt: Set to current time
 *
 * Example Usage:
 * ```typescript
 * // After winner selection
 * const randomSeed = '0x1a2b3c...'; // from block hash or crypto.randomBytes
 * const winningTicket = selectWinningTicket(randomSeed, totalTickets);
 *
 * await winnerRepo.create({
 *   raffleId: 'raffle-123',
 *   walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   ticketNumber: winningTicket,
 *   totalTickets: 100,
 *   prize: 500000000, // 500 USDC
 *   tier: '1st',
 *   payoutStatus: 'pending'
 * });
 * ```
 *
 * Side Effects (handled by repository/API):
 * - Increment user.totalWon by prize amount
 * - Increment user.rafflesWon by 1
 * - Update user.winRate
 * - Increment platformStats.totalWinners by 1
 * - Decrement user.activeEntries by 1
 *
 * Verification:
 * Anyone can verify the winner selection is fair by:
 * 1. Get raffle.randomSeed from database
 * 2. Re-run selection algorithm with same seed
 * 3. Verify winner.ticketNumber matches result
 * 4. Check algorithm source code on GitHub (open source)
 */
export type CreateWinnerInput = Pick<
  WinnerItem,
  'raffleId' | 'walletAddress' | 'ticketNumber' | 'totalTickets' | 'prize' | 'tier'
> & {
  payoutStatus?: PayoutStatus;
  payoutTransactionHash?: string;
  payoutProcessedAt?: string;
  payoutError?: string;
};
