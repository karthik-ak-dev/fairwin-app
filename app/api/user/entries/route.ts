import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { getUserEntriesEnriched } from '@/lib/services/user/user-entry.service';

/**
 * GET /api/user/entries
 *
 * Get user's entries with raffle details
 *
 * Query params:
 * - address: Wallet address (required)
 * - limit: Number of entries per page (default: 20)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('address');

    if (!address) {
      return badRequest('Missing required parameter: address');
    }

    const result = await getUserEntriesEnriched(address, {
      limit: parseInt(searchParams.get('limit') || '20', 10),
      cursor: searchParams.get('cursor') || undefined,
    });

    return paginated(result.entries, result.hasMore, result.nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
