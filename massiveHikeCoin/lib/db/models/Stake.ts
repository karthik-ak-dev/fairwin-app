// Stake model (game-specific for staking feature)
// Responsibilities:
// - Define Stake interface with TypeScript types
// - Fields: stakeId (PK), userId (FK), amount, startDate, endDate (24 months later),
//   currentMonth, status (active/completed/withdrawn), txHash, createdAt, updatedAt
// - Track individual stake lifecycle
// - Store blockchain transaction reference
// - Support multiple stakes per user
// - Calculate maturity date (startDate + 24 months)
