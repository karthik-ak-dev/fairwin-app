/**
 * JWT Token Service
 *
 * Handles JWT token generation and verification using jose library.
 * Tokens are signed with HS256 algorithm and include wallet address claims.
 *
 * Token Structure:
 * - iss: Issuer (FairWin)
 * - sub: Subject (wallet address)
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp
 * - address: Wallet address
 * - isAdmin: Admin flag (optional)
 */

import { SignJWT, jwtVerify } from 'jose';
import { JWT_EXPIRATION, JWT_EXPIRATION_SECONDS } from '@/lib/constants/auth.constants';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_ISSUER = 'fairwin';

interface TokenPayload {
  address: string;
  isAdmin?: boolean;
}

interface VerifiedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a wallet address
 *
 * @param address Wallet address to include in token
 * @param isAdmin Whether this is an admin token
 * @returns Signed JWT token string
 */
export async function generateToken(address: string, isAdmin: boolean = false): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    address: address.toLowerCase(),
    isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setSubject(address.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret);

  return token;
}

/**
 * Verify a JWT token and extract payload
 *
 * @param token JWT token string
 * @returns Verified token payload
 * @throws Error if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<VerifiedToken> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
    });

    return {
      address: payload.address as string,
      isAdmin: payload.isAdmin as boolean || false,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader Authorization header value (Bearer token)
 * @returns Token string without "Bearer " prefix
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Get expiration time in seconds
 */
export function getExpirationSeconds(): number {
  return JWT_EXPIRATION_SECONDS;
}
