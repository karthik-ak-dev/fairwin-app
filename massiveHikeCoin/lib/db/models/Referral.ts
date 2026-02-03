// Referral model (game-specific for MLM feature)
// Responsibilities:
// - Define Referral interface with TypeScript types
// - Fields: referralId (PK), referrerId (FK), referredUserId (FK), level (1-5),
//   stakeId (FK), commissionAmount, commissionRate, status (pending/paid), createdAt
// - Track referral relationships and commission earnings
// - Store which stake generated the commission
// - Support 5-level deep MLM structure
// - Track commission payment status
