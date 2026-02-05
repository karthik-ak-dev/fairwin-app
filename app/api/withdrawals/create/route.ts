// POST /api/withdrawals/create - Process withdrawal request
// Responsibilities:
// - Authenticate user via JWT
// - Validate withdrawal date (only 1st of month)
// - Call withdrawal.service.processWithdrawal(userId, amount)
// - Execute blockchain transaction
// - Return withdrawal record with txHash
// - Error handling for insufficient balance, invalid date
// - Return 403 if not withdrawal day
