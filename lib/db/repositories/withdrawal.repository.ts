// Withdrawal Repository - CRUD operations for Withdrawal model
// Responsibilities:
// - createWithdrawal(userId, amount, type, stakeIds): Create withdrawal request
// - getWithdrawalById(withdrawalId): Fetch withdrawal by ID
// - getWithdrawalsByUserId(userId): Get user's withdrawal history
// - getPendingWithdrawals(): Get all pending withdrawals (admin use)
// - updateWithdrawalStatus(withdrawalId, status, txHash?): Update status after processing
// - getTotalWithdrawnByUserId(userId): Sum all completed withdrawals
// - getLastWithdrawalDate(userId): Get date of last withdrawal
// - All methods use DynamoDB DocumentClient
// - Support filtering by date range for monthly withdrawal validation
