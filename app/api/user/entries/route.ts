import { NextRequest } from 'next/server';
import { handleError, badRequest, unauthorized } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { getUserEntriesEnriched } from '@/lib/services/user/user-entry.service';
import { requireAuth } from '@/lib/api/admin-auth';
import { pagination } from '@/lib/constants';

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

    // Verify JWT token
    const authenticatedAddress = await requireAuth(request);

    // Ensure user can only view their own entries
    if (authenticatedAddress.toLowerCase() !== address.toLowerCase()) {
      return unauthorized('You can only view your own entries');
    }

    const result = await getUserEntriesEnriched(address, {
      limit: parseInt(searchParams.get('limit') || String(pagination.DEFAULT_LIMIT), 10),
      cursor: searchParams.get('cursor') || undefined,
    });

    return paginated(result.entries, result.hasMore, result.nextCursor);
  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized(error.message);
    }
    return handleError(error);
  }
}
