// GET /api/users/profile - Get user profile
// Responsibilities:
// - Authenticate user via JWT
// - Call user.repository.getUserById(userId)
// - Return user profile: walletAddress, depositWallet, withdrawalWallet, referralCode, createdAt
// - Used by profile page

// PATCH /api/users/profile - Update user profile
// Responsibilities:
// - Authenticate user via JWT
// - Allow updating withdrawalWallet only
// - Validate wallet address format
// - Return updated user object
