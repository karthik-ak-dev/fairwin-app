import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getUserSummary } from '@/lib/services/user/user-profile.service';

/**
 * GET /api/user
 *
 * Get user profile with statistics
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

    const result = await getUserSummary(address);

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
