// Next.js middleware for route protection
// Responsibilities:
// - Check JWT token on protected routes
// - Redirect to login if unauthenticated
// - Verify admin access for /admin routes
// - Verify API authentication for /api routes (except /api/auth/login)
// - Set security headers
// - Runs on edge runtime for all matching routes
