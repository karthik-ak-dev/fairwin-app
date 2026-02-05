// GET /api/auth/verify - Verify JWT token validity
// Responsibilities:
// - Extract JWT from Authorization header
// - Verify token using auth.service
// - Return user data if valid
// - Return 401 if invalid/expired
// - Used by client to check auth status on page load
