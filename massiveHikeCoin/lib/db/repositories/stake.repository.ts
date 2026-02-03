// Stake Repository - CRUD operations for Stake model
// Responsibilities:
// - createStake(userId, amount, txHash): Create new stake entry
// - getStakeById(stakeId): Fetch stake by ID
// - getStakesByUserId(userId): Get all stakes for a user
// - getActiveStakesByUserId(userId): Get only active stakes
// - updateStakeStatus(stakeId, status): Update stake status
// - getAllActiveStakes(): Get all active stakes (admin use)
// - calculateStakeProgress(stakeId): Calculate months elapsed and remaining
// - All methods use DynamoDB DocumentClient
// - Support querying multiple stakes per user
