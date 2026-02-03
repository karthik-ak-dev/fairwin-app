// Authentication Service - JWT and wallet signature verification
// Responsibilities:
// - verifyWalletSignature(walletAddress, signature, message): Verify wallet ownership
// - generateAuthToken(userId, walletAddress): Create JWT token
// - verifyAuthToken(token): Validate and decode JWT
// - createOrGetUser(walletAddress, referralCode?): Get existing user or create new
// - Uses user.repository
// - Uses jsonwebtoken library
// - Returns user object with JWT token
