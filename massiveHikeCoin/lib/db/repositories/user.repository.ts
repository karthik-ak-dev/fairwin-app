// User Repository - CRUD operations for User model
// Responsibilities:
// - createUser(walletAddress, referralCode?, depositWallet): Create new user
// - getUserById(userId): Fetch user by ID
// - getUserByWallet(walletAddress): Fetch user by wallet address
// - getUserByReferralCode(referralCode): Find user by referral code
// - updateUser(userId, data): Update user profile
// - updateWithdrawalWallet(userId, withdrawalWallet): Update withdrawal address
// - incrementTotalStaked(userId, amount): Update total staked amount
// - All methods use DynamoDB DocumentClient
// - Handle duplicate wallet prevention
