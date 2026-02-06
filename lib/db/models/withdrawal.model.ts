// Withdrawal model
// Responsibilities:
// - Track withdrawal requests and their lifecycle
// - Withdrawals can only be initiated on 1st of each month
// - Maximum withdrawal amount: 1000 USDT per month
// - One simple withdrawal record per user per month
// - User initiates withdrawal, system processes via central wallet
// - Transaction hash monitored and status updated accordingly

// Enums
export enum WithdrawalStatus {
  PENDING = 'pending', // Withdrawal initiated by user, awaiting blockchain transaction
  PROCESSING = 'processing', // Blockchain transaction initiated from central wallet
  COMPLETED = 'completed', // Transaction confirmed on blockchain with txHash
  FAILED = 'failed', // Transaction failed (insufficient funds, blockchain error, etc.)
}

export interface Withdrawal {
  // Primary Key
  withdrawalId: string; // UUID

  // Foreign Keys
  userId: string; // Reference to User.userId

  // Withdrawal Details
  amount: number; // Total withdrawal amount in USDT
  walletAddress: string; // User's BSC wallet address to receive funds

  // Status
  status: WithdrawalStatus; // Current status of this withdrawal

  // Blockchain Transaction
  txHash?: string; // BSC transaction hash from central wallet (set when processing/completed)

  // Failure Details
  failureReason?: string; // Reason if status is FAILED

  // Dates (ISO 8601 strings)
  requestedAt: string; // When user initiated withdrawal (must be 1st of month)
  processedAt?: string; // When blockchain transaction was initiated
  completedAt?: string; // When transaction was confirmed on blockchain

  // Timestamps (ISO 8601 strings)
  createdAt: string; // Record creation timestamp
  updatedAt: string; // Last update timestamp
}
