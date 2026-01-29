/**
 * Winner Model - Raffle Game Specific
 *
 * Represents a winning entry selected by Chainlink VRF after a raffle ends.
 * Each raffle can have multiple winners (1st place, 2nd place, 3rd place, etc.).
 * Winners are selected using provably fair, verifiable randomness from VRF.
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Winners
 * Primary Key: winnerId (HASH)
 * GSI1: raffleId-createdAt-index (raffleId + createdAt) - Get all winners for a raffle
 * GSI2: walletAddress-createdAt-index (walletAddress + createdAt) - Get all wins for a user
 *
 * VRF Winner Selection Process:
 * 1. Raffle ends (current time > endTime)
 * 2. Admin or scheduler triggers draw
 * 3. Smart contract requests random number from Chainlink VRF
 * 4. VRF Coordinator returns verifiable random number
 * 5. Random number used to select winning ticket numbers
 * 6. Winner records created for each prize tier
 * 7. Payouts initiated
 *
 * Use Cases:
 * - Display winners on raffle results page
 * - Show user's win history
 * - Calculate payout amounts
 * - Verify VRF fairness (ticket selection)
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
   * Selected deterministically using VRF random number
   *
   * Example: If totalTickets = 100, ticketNumber could be 42
   *
   * Selection algorithm:
   * winningTicket = (vrfRandomNumber % totalTickets) + 1
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
   * Blockchain transaction hash of payout (optional)
   * Set when payout is processed and sent to winner
   * Example: "0xpay0ut...hash1234"
   *
   * Used for:
   * - Proof of payment
   * - Link to block explorer
   * - Verify payout was sent
   * - Reconciliation
   *
   * Remains undefined until payout is processed
   */
  transactionHash?: string;

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
}

/**
 * Input type for creating a new winner
 *
 * Called after VRF returns random number and winners are selected.
 * Only requires fields from VRF result - other fields are generated:
 * - winnerId: Generated as UUID
 * - transactionHash: Set later when payout is processed
 * - createdAt: Set to current time
 *
 * Example Usage:
 * ```typescript
 * // After VRF selects winners
 * const vrfRandom = 123456789;
 * const winningTicket = (vrfRandom % totalTickets) + 1;
 *
 * await winnerRepo.create({
 *   raffleId: 'raffle-123',
 *   walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   ticketNumber: winningTicket,
 *   totalTickets: 100,
 *   prize: 500000000, // 500 USDC
 *   tier: '1st'
 * });
 * ```
 *
 * Side Effects (handled by repository/API):
 * - Create corresponding PayoutItem with status='pending'
 * - Increment user.totalWon by prize amount
 * - Increment user.rafflesWon by 1
 * - Update user.winRate
 * - Increment platformStats.totalWinners by 1
 * - Decrement user.activeEntries by 1
 *
 * Verification:
 * Anyone can verify the winner selection is fair by:
 * 1. Get raffle.vrfRandomWord from blockchain
 * 2. Calculate: winningTicket = (vrfRandomWord % totalTickets) + 1
 * 3. Verify winner.ticketNumber matches calculation
 * 4. Check Chainlink VRF proof on-chain
 */
export type CreateWinnerInput = Pick<
  WinnerItem,
  'raffleId' | 'walletAddress' | 'ticketNumber' | 'totalTickets' | 'prize' | 'tier'
>;
