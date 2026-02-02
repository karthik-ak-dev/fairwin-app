import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { parsePaginationParams } from '@/lib/api/request';
import { getUserEntriesEnriched } from '@/lib/services/user/user-entry.service';
import { requireMatchingAuth } from '@/lib/api/auth';

/**
 * GET /api/user/entries
 *
 * Get user's entries with raffle details
 *
 * Requires: Authorization header with valid JWT token
 *
 * Query params:
 * - address: Wallet address (required)
 * - limit: Number of entries per page (default from constants)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('address');

    if (!address) {
      return badRequest('Missing required parameter: address');
    }

    // Verify authentication and ensure user can only view their own entries
    await requireMatchingAuth(request, address);

    const params = parsePaginationParams(searchParams);
    const result = await getUserEntriesEnriched(address, params);

    return paginated(result.entries, result.hasMore, result.nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
