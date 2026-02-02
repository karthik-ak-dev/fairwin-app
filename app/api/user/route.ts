import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getUserSummary } from '@/lib/services/user/user-profile.service';
import { requireMatchingAuth } from '@/lib/api/auth';

/**
 * GET /api/user
 *
 * Get user profile with statistics
 *
 * Requires: Authorization header with valid JWT token
 *
 * Query params:
 * - address: Wallet address (required)
 */
export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');

    if (!address) {
      return badRequest('Missing required parameter: address');
    }

    // SECURITY: Verify authentication and ensure user can only view their own profile
    await requireMatchingAuth(request, address);

    const result = await getUserSummary(address);

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
