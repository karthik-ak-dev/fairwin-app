/**
 * Entry Model - Raffle Game Specific
 *
 * Represents a single entry (ticket purchase) transaction in a raffle.
 * Each entry represents a user buying one or more tickets for a specific raffle.
 * Users can make multiple entry transactions for the same raffle (up to maxEntriesPerUser).
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Entries
 * Primary Key: entryId (HASH)
 * GSI1: raffleId-createdAt-index (raffleId + createdAt) - Get all entries for a raffle
 * GSI2: walletAddress-createdAt-index (walletAddress + createdAt) - Get all entries for a user
 *
 * Transaction Flow:
 * 1. User approves USDC spending on frontend
 * 2. User calls smart contract enterRaffle(raffleId, numEntries)
 * 3. Transaction confirmed on-chain
 * 4. Frontend calls API to record entry in database
 * 5. Entry status set to 'confirmed'
 *
 * Use Cases:
 * - Display raffle participants list
 * - Show user's entry history
 * - Validate user hasn't exceeded maxEntriesPerUser
 * - Calculate total entries for prize pool
 * - Audit trail for all raffle entries
 */
export interface EntryItem {
  /**
   * Unique identifier for this entry transaction (Primary Key)
   * Generated as UUID v4
   * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  entryId: string;

  /**
   * ID of the raffle this entry belongs to
   * Foreign key to RaffleItem.raffleId
   * Used in GSI1 to query all entries for a specific raffle
   */
  raffleId: string;

  /**
   * Wallet address of the user who made this entry
   * Format: 0x-prefixed hex string (42 characters)
   * Used in GSI2 to query all entries by a specific user
   */
  walletAddress: string;

  /**
   * Number of tickets purchased in this transaction
   * Minimum: 1
   * Maximum: Limited by raffle.maxEntriesPerUser and available funds
   * Each ticket increases chance of winning
   *
   * Example: If user buys 5 entries at 10 USDC each = 50 USDC total
   */
  numEntries: number;

  /**
   * Total amount paid for this entry in USDC (smallest unit)
   * Calculated as: numEntries * raffle.entryPrice
   * Example: 5 entries * 10 USDC = 50000000 (50 USDC in smallest unit)
   *
   * This amount is added to raffle.prizePool
   */
  totalPaid: number;

  /**
   * Blockchain transaction hash proving payment
   * Example: "0xabcd1234...5678efab"
   * Used for:
   * - On-chain verification
   * - Linking to block explorer (Polygonscan)
   * - Audit trail
   * - Dispute resolution
   */
  transactionHash: string;

  /**
   * Block number when transaction was mined
   * Example: 12345678
   * Used for:
   * - Chronological ordering
   * - Blockchain event syncing
   * - Finality confirmation (wait N blocks)
   */
  blockNumber: number;

  /**
   * Current status of this entry transaction
   *
   * - confirmed: Transaction mined and verified on-chain (normal state)
   * - pending: Transaction submitted but not yet mined (temporary)
   * - failed: Transaction reverted or failed (rare, requires investigation)
   * - refunded: Entry refunded due to raffle cancellation
   *
   * Most entries should be 'confirmed' within seconds
   */
  status: 'confirmed' | 'pending' | 'failed' | 'refunded';

  /**
   * Source of entry creation
   *
   * - PLATFORM: Created through platform API (user entered via frontend)
   * - DIRECT_CONTRACT: Created from blockchain event sync (user called contract directly)
   * - BOTH: Created via platform AND confirmed by blockchain event sync
   *
   * Used for:
   * - Analytics: Track platform vs direct contract usage
   * - Debugging: Identify entries that bypassed platform
   * - Reconciliation: Ensure platform entries match blockchain events
   */
  source?: 'PLATFORM' | 'DIRECT_CONTRACT' | 'BOTH';

  /**
   * ISO 8601 timestamp of when entry was created
   * Example: "2025-01-29T14:30:00.000Z"
   *
   * Used in both GSIs as sort key for chronological ordering
   * Important for:
   * - Displaying recent entries first
   * - Analytics and time-series data
   * - Entry cutoff enforcement (no entries after endTime)
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of when entry was last updated
   * Example: "2025-01-29T14:35:00.000Z"
   *
   * Updated when:
   * - Entry source changes (PLATFORM → BOTH)
   * - Entry status changes (confirmed → refunded)
   */
  updatedAt?: string;
}

/**
 * Input type for creating a new entry
 *
 * Only requires fields from transaction - other fields are generated:
 * - entryId: Generated as UUID
 * - status: Defaults to 'confirmed' (or 'pending' if async)
 * - createdAt: Set to current time
 *
 * Example Usage:
 * ```typescript
 * await entryRepo.create({
 *   raffleId: 'raffle-123',
 *   walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   numEntries: 5,
 *   totalPaid: 5000000, // 5 USDC
 *   transactionHash: '0xabcd...1234',
 *   blockNumber: 12345678
 * });
 * ```
 *
 * Side Effects (handled by repository/API):
 * - Increment raffle.totalEntries by numEntries
 * - Increment raffle.totalParticipants by 1 (if new participant)
 * - Increment raffle.prizePool by totalPaid
 * - Increment user.totalSpent by totalPaid
 * - Increment user.rafflesEntered by 1 (if new raffle)
 * - Increment user.activeEntries by 1
 * - Increment platformStats.totalEntries by 1
 * - Increment platformStats.totalRevenue by protocolFee portion
 */
export type CreateEntryInput = Pick<
  EntryItem,
  'raffleId' | 'walletAddress' | 'numEntries' | 'totalPaid' | 'transactionHash' | 'blockNumber'
>;
