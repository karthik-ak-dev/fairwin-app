/**
 * Payout Model - Raffle Game Specific
 *
 * Represents a prize payment transaction that was automatically executed by the smart contract.
 * Created as a RECORD of on-chain payouts when WinnersSelected event is detected.
 *
 * IMPORTANT: Payouts are NOT processed by the backend.
 * - Smart contract automatically sends USDC to winners on-chain
 * - Backend listens to WinnersSelected event and creates records with status='paid'
 * - This is a read-only record of what happened on-chain
 *
 * DynamoDB Table: FairWin-{Env}-Raffle-Payouts
 * Primary Key: payoutId (HASH)
 * GSI1: winnerId-createdAt-index (winnerId + createdAt) - Get all payouts for a winner
 * GSI2: status-createdAt-index (status + createdAt) - Query payouts by status
 *
 * Payout Flow (Automated by Contract):
 * 1. Admin triggers draw via contract
 * 2. Contract requests randomness from Chainlink VRF
 * 3. VRF responds with random number
 * 4. Contract selects winners and AUTOMATICALLY sends USDC to them
 * 5. Contract emits WinnersSelected event
 * 6. Backend event listener detects event
 * 7. Backend creates PayoutItem records with status='paid' (recording only)
 * 8. transactionHash captured from event for proof
 *
 * Use Cases:
 * - Historical record of all payouts
 * - Reconciliation and accounting
 * - Display winner payment status in UI
 * - Audit trail for financial reporting
 * - Link to blockchain transaction (Polygonscan)
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
   * - 'paid': Winner was paid by smart contract (only state used in current architecture)
   *
   * NOTE: 'pending' and 'failed' states exist for backwards compatibility but are unused.
   * All payouts are created with status='paid' because the contract pays winners automatically.
   * There is no backend payout processing - we only record what the contract did.
   *
   * The contract guarantees payment before emitting the WinnersSelected event,
   * so when we create a PayoutItem, the winner has already been paid on-chain.
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
   *
   * NOTE: Unused in current architecture - kept for backwards compatibility.
   * Contract payouts cannot fail after WinnersSelected event is emitted.
   * If a winner's address is invalid, the contract reverts before emitting the event.
   *
   * Always undefined since all payouts have status='paid'.
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
 * Called automatically when WinnersSelected blockchain event is detected.
 * Creates a RECORD of an already-completed on-chain payment.
 *
 * Generated fields:
 * - payoutId: Generated as UUID
 * - status: Always set to 'paid' (contract already paid winner)
 * - transactionHash: Set from blockchain event
 * - createdAt, updatedAt: Set to current time
 * - processedAt: Set to current time (payment already processed by contract)
 *
 * Example Usage:
 * ```typescript
 * // In event-listener.service.ts when handling WinnersSelected event
 * await payoutRepo.create({
 *   winnerId: winner.winnerId,
 *   raffleId: winner.raffleId,
 *   walletAddress: winner.walletAddress,
 *   amount: winner.prize
 * });
 *
 * // Then immediately update to paid status with transaction hash
 * await payoutRepo.updateStatus(
 *   payout.payoutId,
 *   'paid',
 *   eventTransactionHash
 * );
 * ```
 *
 * Reconciliation:
 * - Sum of all payout.amount should equal total prizes distributed
 * - Each winner.winnerId should have exactly one payout
 * - payout.amount should always equal winner.prize
 * - All payouts should have status='paid' and a valid transactionHash
 * - Transaction hash should be verifiable on Polygonscan
 */
export type CreatePayoutInput = Pick<PayoutItem, 'winnerId' | 'raffleId' | 'walletAddress' | 'amount'> & {
  status?: 'pending' | 'processing' | 'paid' | 'failed';
  transactionHash?: string;
  processedAt?: string;
};
