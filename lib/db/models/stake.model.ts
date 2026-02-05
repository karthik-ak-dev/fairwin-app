// Stake model (game-specific for staking feature)
// Responsibilities:
// - Define Stake interface with TypeScript types
// - Fields: stakeId (PK), userId (FK), amount, startDate, endDate (24 months later),
//   currentMonth, status (active/completed/withdrawn), txHash, createdAt, updatedAt
// - Track individual stake lifecycle
// - Store blockchain transaction reference
// - Support multiple stakes per user
// - Calculate maturity date (startDate + 24 months)

// Enums
export enum StakeStatus {
  PENDING = 'pending',     // User initiated stake, awaiting txHash submission
  VERIFYING = 'verifying', // TxHash submitted, verifying on-chain
  ACTIVE = 'active',       // Verified and earning (can calculate earnings based on startDate)
  COMPLETED = 'completed', // Reached 24 months (endDate passed)
}

export interface Stake {
  // Primary Key
  stakeId: string; // UUID or auto-generated ID

  // Foreign Keys
  userId: string; // Reference to User.userId
  stakeConfigId: string; // Reference to StakeConfig.stakeConfigId (e.g., "8_PERCENT_24_MONTHS")

  // Stake Details
  amount: number; // Stake amount in USDT (e.g., 100.50)

  // Dates (ISO 8601 strings)
  startDate: string; // When the stake became active (after verification)
  endDate: string; // Maturity date (startDate + config.durationMonths)

  // Status
  status: StakeStatus; // Current status of the stake

  // Blockchain
  txHash?: string; // BSC transaction hash (submitted by user, optional until provided)

  // Timestamps (ISO 8601 strings)
  createdAt: string; // Record creation timestamp
  updatedAt: string; // Last update timestamp
}
