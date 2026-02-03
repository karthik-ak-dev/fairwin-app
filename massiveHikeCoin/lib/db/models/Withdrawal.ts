// Withdrawal model
// Responsibilities:
// - Define Withdrawal interface with TypeScript types
// - Fields: withdrawalId (PK), userId (FK), amount, type (stake_rewards/referral_commission/both),
//   stakeIds (array of stakes included), status (pending/completed/failed),
//   txHash, requestedAt, completedAt
// - Track withdrawal history and status
// - Store blockchain transaction reference
// - Support partial withdrawals (specific stakes)
// - Enforce monthly withdrawal date constraint
