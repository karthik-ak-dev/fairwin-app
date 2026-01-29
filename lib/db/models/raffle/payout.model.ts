/**
 * Payout Model - Raffle Game Specific
 *
 * Represents a prize payment transaction from platform to winner.
 * Created automatically when winners are selected, then processed asynchronously.
 * Tracks the entire payout lifecycle from pending → paid/failed.
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Payouts
 * Primary Key: payoutId (HASH)
 * GSI1: winnerId-createdAt-index (winnerId + createdAt) - Get all payouts for a winner
 * GSI2: status-createdAt-index (status + createdAt) - Get pending/failed payouts
 *
 * Payout Flow:
 * 1. Winners selected via VRF
 * 2. PayoutItem created with status='pending'
 * 3. Background worker/cron picks up pending payouts
 * 4. USDC transferred from platform wallet to winner wallet
 * 5. On success: status='paid', transactionHash set
 * 6. On failure: status='failed', error message logged
 * 7. Failed payouts are retried (manual or automatic)
 *
 * Use Cases:
 * - Admin payout queue/dashboard
 * - Monitor pending payouts
 * - Retry failed payouts
 * - Reconciliation and accounting
 * - Fraud prevention (verify amounts)
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
   * - pending: Created, waiting to be processed (normal initial state)
   * - paid: Successfully sent to winner (final success state)
   * - failed: Transaction failed, needs investigation (requires retry)
   *
   * State Transitions:
   * pending → paid (success path)
   * pending → failed (error path)
   * failed → pending (retry)
   *
   * Used in GSI2 to query all pending/failed payouts for processing
   */
  status: 'pending' | 'paid' | 'failed';

  /**
   * Blockchain transaction hash of successful payout (optional)
   * Set only when status='paid'
   * Example: "0x1234abcd...5678efgh"
   *
   * Used for:
   * - Proof of payment
   * - Link to Polygonscan
   * - On-chain verification
   * - Audit trail
   * - Dispute resolution
   *
   * Remains undefined if status='pending' or 'failed'
   */
  transactionHash?: string;

  /**
   * Error message if payout failed (optional)
   * Set only when status='failed'
   *
   * Common errors:
   * - "Insufficient balance in operator wallet"
   * - "Gas price too high, retry later"
   * - "Invalid recipient address"
   * - "Transaction reverted: <reason>"
   * - "RPC timeout, verification pending"
   *
   * Used for:
   * - Admin troubleshooting
   * - Automated retry logic
   * - Alerting and monitoring
   *
   * Remains undefined if status='pending' or 'paid'
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
 * Input type for creating a new payout
 *
 * Called automatically when winners are created.
 * Only requires winner info - other fields are generated or set later:
 * - payoutId: Generated as UUID
 * - status: Defaults to 'pending'
 * - transactionHash: Set when payout succeeds
 * - error: Set when payout fails
 * - createdAt, updatedAt: Set to current time
 * - processedAt: Set when status becomes 'paid'
 *
 * Example Usage:
 * ```typescript
 * // After creating winner record
 * await payoutRepo.create({
 *   winnerId: winner.winnerId,
 *   raffleId: winner.raffleId,
 *   walletAddress: winner.walletAddress,
 *   amount: winner.prize
 * });
 * ```
 *
 * Processing Flow (handled by background worker):
 * 1. Query pending payouts: payoutRepo.getByStatus('pending')
 * 2. For each payout:
 *    a. Verify operator wallet has sufficient balance
 *    b. Send USDC to walletAddress
 *    c. Wait for transaction confirmation
 *    d. On success: updateStatus('paid', txHash)
 *    e. On failure: updateStatus('failed', undefined, errorMsg)
 * 3. Update platformStats.totalPaidOut
 * 4. Update winner.transactionHash
 *
 * Monitoring:
 * - Alert if pending payouts > 100
 * - Alert if any payout pending > 1 hour
 * - Alert on repeated failures for same payout
 * - Dashboard showing pending/paid/failed counts
 *
 * Reconciliation:
 * - Sum of all payout.amount (status='paid') should equal platformStats.totalPaidOut
 * - Each winner.winnerId should have exactly one payout with status='paid'
 * - payout.amount should always equal winner.prize
 */
export type CreatePayoutInput = Pick<PayoutItem, 'winnerId' | 'raffleId' | 'walletAddress' | 'amount'>;
