/**
 * Import PayoutStatus enum from winner model
 * This enum is shared between WinnerItem.payoutStatus and PayoutItem.status
 */
import { PayoutStatus } from './winner.model';

/**
 * Payout Model - Raffle Game Specific
 *
 * Represents a prize payment transaction sent to a winner.
 * Admin manually sends USDC to winners after reviewing the draw results.
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Payouts
 * Primary Key: payoutId (HASH)
 * GSI1: winnerId-createdAt-index (winnerId + createdAt) - Get all payouts for a winner
 * GSI2: status-createdAt-index (status + createdAt) - Query payouts by status
 *
 * Payout Flow (Manual):
 * 1. Admin triggers draw → Winners selected immediately
 * 2. Backend creates WinnerItem records with payoutStatus='pending'
 * 3. Admin reviews winners in admin panel
 * 4. Admin clicks "Send Payouts"
 * 5. Backend/Admin sends USDC transactions to each winner
 * 6. Backend creates PayoutItem records with status='paid'
 * 7. transactionHash stored for proof
 *
 * Use Cases:
 * - Historical record of all payouts
 * - Reconciliation and accounting
 * - Display winner payment status in UI
 * - Audit trail for financial reporting
 * - Link to blockchain transaction (Polygonscan)
 * - Track pending vs completed payouts
 */
export interface PayoutItem {
  /**
   * Unique identifier for this payout transaction (Primary Key)
   * Generated as UUID v4
   * Example: "p4y0ut-1234-5678-90ab-cdefgh123456"
   *
   * One winnerId can have multiple payoutIds if retries are needed
   */
  payoutId: string;

  /**
   * ID of the winner receiving this payout
   * Foreign key to WinnerItem.winnerId
   * Used in GSI1 to query all payout attempts for a specific winner
   *
   * Typically 1:1 relationship, but could be 1:many if retries occur
   */
  winnerId: string;

  /**
   * ID of the raffle this payout belongs to
   * Foreign key to RaffleItem.raffleId
   * Used for reporting and reconciliation
   *
   * Allows queries like "Show all payouts for raffle X"
   * Useful for raffle-level financial reports
   */
  raffleId: string;

  /**
   * Recipient wallet address
   * Format: 0x-prefixed hex string (42 characters)
   * Copied from WinnerItem.walletAddress for convenience
   *
   * This is where USDC will be sent
   * Validated before payout to ensure it's a valid address
   */
  walletAddress: string;

  /**
   * Payout amount in USDC (smallest unit)
   * Should match WinnerItem.prize exactly
   * 1 USDC = 1,000,000 (6 decimals)
   *
   * Example: 500 USDC = 500000000
   *
   * Verified before sending to prevent overpayment
   * Double-checked against winner.prize for reconciliation
   */
  amount: number;

  /**
   * Current status of this payout
   *
   * - pending: Payout queued but not yet sent
   * - processing: Transaction submitted to blockchain
   * - paid: USDC successfully sent to winner
   * - failed: Transaction failed or was rejected
   *
   * Status Transitions:
   * - pending → processing (when admin initiates payout)
   * - processing → paid (when transaction confirms)
   * - processing → failed (if transaction fails)
   * - failed → processing (when retrying)
   */
  status: PayoutStatus;

  /**
   * Blockchain transaction hash of payout (optional)
   * Set when transaction is submitted to blockchain
   * Example: "0x1234abcd...5678efgh"
   *
   * Used for:
   * - Proof of payment
   * - Link to Polygonscan
   * - On-chain verification
   * - Audit trail
   * - Dispute resolution
   *
   * Set when status='processing' or 'paid'
   * Remains undefined if status='pending'
   */
  transactionHash?: string;

  /**
   * Error message if payout failed (optional)
   * Contains reason why transaction failed
   * Examples:
   * - "Insufficient balance"
   * - "Transaction reverted"
   * - "Invalid recipient address"
   * - "Gas estimation failed"
   *
   * Only set when status='failed'
   * Used for debugging and retry logic
   */
  error?: string;

  /**
   * ISO 8601 timestamp when payout was created
   * Example: "2025-01-29T23:59:59.999Z"
   *
   * Usually immediately after winner selection
   * Used in both GSIs as sort key for chronological ordering
   *
   * Important for:
   * - Processing payouts in FIFO order
   * - SLA tracking (time from creation to payment)
   * - Financial reporting
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when payout was successfully processed (optional)
   * Set only when status transitions to 'paid'
   * Example: "2025-01-30T00:05:30.123Z"
   *
   * Used to calculate:
   * - Payout processing time (processedAt - createdAt)
   * - Average payout latency
   * - SLA compliance
   *
   * Remains undefined if status='pending' or 'failed'
   */
  processedAt?: string;

  /**
   * ISO 8601 timestamp of last payout update
   * Updated whenever status, error, or transactionHash changes
   *
   * Useful for:
   * - Monitoring stale pending payouts
   * - Retry scheduling
   * - Change tracking
   */
  updatedAt: string;
}

/**
 * Input type for creating a new payout record
 *
 * Created when winners are selected, initially with status='pending'.
 * Updated to 'paid' when admin sends USDC transaction.
 *
 * Generated fields:
 * - payoutId: Generated as UUID
 * - status: Defaults to 'pending' (admin hasn't sent yet)
 * - transactionHash: Set later when payout is sent
 * - createdAt, updatedAt: Set to current time
 * - processedAt: Set when status transitions to 'paid'
 *
 * Example Usage:
 * ```typescript
 * // After winner selection
 * await payoutRepo.create({
 *   winnerId: winner.winnerId,
 *   raffleId: winner.raffleId,
 *   walletAddress: winner.walletAddress,
 *   amount: winner.prize,
 *   status: 'pending'
 * });
 *
 * // Later, when admin sends payout
 * await payoutRepo.updateStatus(
 *   payout.payoutId,
 *   'paid',
 *   transactionHash
 * );
 * ```
 *
 * Reconciliation:
 * - Sum of all payout.amount should equal total prizes distributed
 * - Each winner.winnerId should have exactly one payout
 * - payout.amount should always equal winner.prize
 * - All completed payouts should have status='paid' and a valid transactionHash
 * - Transaction hash should be verifiable on Polygonscan
 */
export type CreatePayoutInput = Pick<PayoutItem, 'winnerId' | 'raffleId' | 'walletAddress' | 'amount'> & {
  status?: PayoutStatus;
  transactionHash?: string;
  processedAt?: string;
  error?: string;
};
