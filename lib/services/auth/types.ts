/**
 * Auth Service Types
 *
 * Types related to authentication operations including:
 * - JWT token payloads
 * - Challenge generation
 * - Signature verification
 * - Auth request/response types
 */

// ============================================================================
// JWT Token Types
// ============================================================================

/**
 * JWT token payload
 * Contains core claims for authenticated requests
 */
export interface TokenPayload {
  /** Wallet address (lowercase) */
  address: string;
  /** Whether this user has admin privileges */
  isAdmin?: boolean;
}

/**
 * Verified JWT token with timing information
 * Returned after successful token verification
 */
export interface VerifiedToken extends TokenPayload {
  /** Issued at timestamp (seconds since epoch) */
  iat: number;
  /** Expiration timestamp (seconds since epoch) */
  exp: number;
}

// ============================================================================
// Challenge Types
// ============================================================================

/**
 * Challenge request body
 * POST /api/auth/challenge
 */
export interface ChallengeRequest {
  /** Wallet address requesting authentication */
  address: string;
}

/**
 * Challenge response
 * Contains message to be signed by wallet
 */
export interface ChallengeResponse {
  /** Challenge message to sign */
  challenge: string;
  /** Challenge expiration time in seconds (300 = 5 minutes) */
  expiresIn: number;
}

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Signature verification request body
 * POST /api/auth/verify
 */
export interface VerifyRequest {
  /** Wallet address */
  address: string;
  /** Original challenge message that was signed */
  challenge: string;
  /** Signature produced by wallet */
  signature: string;
}

/**
 * Verification response
 * Contains JWT token for authenticated requests
 */
export interface VerifyResponse {
  /** JWT token for authenticated requests */
  token: string;
  /** Token expiration time in seconds (86400 = 24 hours) */
  expiresIn: number;
  /** Authenticated wallet address (lowercase) */
  address: string;
  /** Whether this wallet has admin privileges */
  isAdmin: boolean;
}

// ============================================================================
// Internal Challenge Store Types
// ============================================================================

/**
 * Stored challenge data (internal)
 * Used by challenge service to track pending challenges
 */
export interface StoredChallenge {
  /** Challenge message */
  challenge: string;
  /** Creation timestamp (milliseconds) */
  timestamp: number;
}
