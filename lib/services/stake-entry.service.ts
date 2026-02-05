// Stake Entry Service - Business logic for creating stakes
// Responsibilities:
// - validateStakeAmount(amount): Check $50-$10,000 range
// - processStakeEntry(userId, amount, txHash, referralCode?): Main stake creation flow
//   1. Validate stake amount
//   2. Verify blockchain transaction
//   3. Create stake record via repository
//   4. Process referral commissions (if referralCode provided)
//   5. Update user's total staked amount
// - verifyBlockchainTransaction(txHash): Confirm USDT transfer on BSC
// - Uses stake.repository and user.repository
// - Uses referral-tree.service for commission processing
// - Returns created stake object
