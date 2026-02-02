/**
 * Entry status enum - represents the state of a raffle entry transaction
 *
 * Entry Lifecycle:
 * 1. PENDING → CONFIRMED (normal entry flow)
 * 2. PENDING → FAILED (transaction failed)
 * 3. CONFIRMED → REFUND_PENDING → REFUND_PROCESSING → REFUNDED (cancellation flow)
 * 4. CONFIRMED → REFUND_PENDING → REFUND_FAILED (refund failed, can retry)
 */
export enum EntryStatus {
  /** Transaction submitted but not yet confirmed on blockchain */
  PENDING = 'pending',

  /** Payment verified on-chain, entry is active */
  CONFIRMED = 'confirmed',

  /** Transaction failed or was rejected */
  FAILED = 'failed',

  /** Raffle cancelled, refund queued but not yet sent */
  REFUND_PENDING = 'refund_pending',

  /** Refund transaction in progress */
  REFUND_PROCESSING = 'refund_processing',

  /** USDC successfully refunded to user */
  REFUNDED = 'refunded',

  /** Refund transaction failed, needs retry */
  REFUND_FAILED = 'refund_failed',
}

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
 * 1. User transfers USDC directly to the platform wallet on Polygon
 * 2. Transaction is confirmed on Polygon blockchain (typically 2-5 seconds)
 * 3. Frontend calls API with the transaction hash
 * 4. Backend verifies the USDC transfer on-chain by reading the transaction
 * 5. Entry is recorded in database with status 'confirmed'
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
   * Polygon transaction hash proving USDC payment
   * Example: "0xabcd1234...5678efab"
   * Used for:
   * - Backend verification (verify USDC transfer to platform wallet)
   * - Linking to block explorer (Polygonscan)
   * - Audit trail
   * - Dispute resolution
   * - Prevents duplicate entries (transaction can only be used once)
   */
  transactionHash: string;

  /**
   * Current status of this entry
   *
   * Status Flow:
   * - pending: Transaction submitted but not yet confirmed (temporary)
   * - confirmed: Payment verified on-chain (normal active state)
   * - failed: Transaction failed or was rejected (rare)
   * - refund_pending: Raffle cancelled, refund queued
   * - refund_processing: Refund transaction being sent
   * - refunded: USDC successfully returned to user
   * - refund_failed: Refund transaction failed (can be retried)
   *
   * Most entries should be 'confirmed' within 15-30 seconds on Polygon
   */
  status: EntryStatus;

  /**
   * Transaction hash of the refund transaction (if refunded)
   * Only populated when status is 'refunded'
   * Used for audit trail and verification
   */
  refundTransactionHash?: string;

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
   * - Entry status changes (confirmed → refunded)
   */
  updatedAt?: string;
}

/**
 * Input type for creating a new entry
 *
 * Only requires fields from transaction - other fields are generated:
 * - entryId: Generated as UUID
 * - status: Defaults to 'confirmed' (after verification)
 * - createdAt: Set to current time
 *
 * Example Usage:
 * ```typescript
 * await entryRepo.create({
 *   raffleId: 'raffle-123',
 *   walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   numEntries: 5,
 *   totalPaid: 5000000, // 5 USDC
 *   transactionHash: '0xabcd...1234'
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
  'raffleId' | 'walletAddress' | 'numEntries' | 'totalPaid' | 'transactionHash'
>;
