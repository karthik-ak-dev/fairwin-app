import { verifyToken, extractTokenFromHeader } from '@/lib/services/auth/jwt.service';
import { unauthorized } from './error-handler';

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
 * Verify that authenticated user matches the requested wallet address
 *
 * Common pattern in user-scoped endpoints to prevent users from
 * accessing other users' data.
 *
 * @param request - Request object with Authorization header
 * @param requestedAddress - The wallet address from the request (query/body)
 * @returns The authenticated address if valid
 * @throws Returns unauthorized response if mismatch
 */
export async function requireMatchingAuth(request: Request, requestedAddress: string) {
  const authenticatedAddress = await requireAuth(request);

  if (authenticatedAddress.toLowerCase() !== requestedAddress.toLowerCase()) {
    throw unauthorized('Authenticated wallet does not match request wallet address');
  }

  return authenticatedAddress;
}
