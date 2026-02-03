// POST /api/auth/login - Wallet signature authentication
// Responsibilities:
// - Receive walletAddress, signature, message from client
// - Verify wallet signature using auth.service
// - Create or get user record
// - Generate JWT token
// - Return user object with auth token
// - Handle referral code on first login (optional)
// - Error handling for invalid signatures
