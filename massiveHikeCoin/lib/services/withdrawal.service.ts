// Withdrawal Service - Business logic for processing withdrawals
// Responsibilities:
// - validateWithdrawalRequest(userId): Check if withdrawal allowed (date validation)
// - calculateWithdrawableAmount(userId): Sum stake rewards + referral commissions
// - processWithdrawal(userId, amount): Main withdrawal flow
//   1. Validate withdrawal date (1st of month)
//   2. Calculate available amount
//   3. Create withdrawal record
//   4. Execute blockchain transaction (USDT transfer)
//   5. Update withdrawal status
// - executeBlockchainWithdrawal(withdrawalWallet, amount): Send USDT via Web3
// - Uses withdrawal.repository, stake-query.service, referral-tree.service
// - Returns withdrawal record with transaction hash
