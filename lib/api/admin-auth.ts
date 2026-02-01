import { NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/auth/jwt.service';

/**
 * Verify JWT token from Authorization header
 *
 * @param request Request object with Authorization header
 * @returns Verified token payload with address and isAdmin flag
 * @throws Error if token is missing, invalid, or expired
 */
export async function verifyAuthToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new Error('Missing authentication token');
  }

  const payload = await verifyToken(token);
  return payload;
}

/**
 * Check if request is from authenticated admin
 *
 * @param request Request object with Authorization header
 * @returns True if request has valid admin token
 */
export async function isAdmin(request: Request): Promise<boolean> {
  try {
    const payload = await verifyAuthToken(request);
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

/**
 * Require admin authentication - throws if not admin
 *
 * @param request Request object
 * @returns Verified admin address
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(request: Request): Promise<string> {
  const payload = await verifyAuthToken(request);

  if (!payload.isAdmin) {
    throw new Error('Admin privileges required');
  }

  return payload.address;
}

/**
 * Require user authentication - throws if not authenticated
 *
 * @param request Request object
 * @returns Verified wallet address
 * @throws Error if not authenticated
 */
export async function requireAuth(request: Request): Promise<string> {
  const payload = await verifyAuthToken(request);
  return payload.address;
}
