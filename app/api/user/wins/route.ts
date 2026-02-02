import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { parsePaginationParams } from '@/lib/api/request';
import { winnerRepo } from '@/lib/db/repositories';
import { decodeCursor, encodeCursor } from '@/lib/services/shared/pagination.service';
import { requireMatchingAuth } from '@/lib/api/auth';

/**
 * GET /api/user/wins
 *
 * Get user's wins
 *
 * Requires: Authorization header with valid JWT token
 *
 * Query params:
 * - address: Wallet address (required)
 * - limit: Number of wins per page (default from constants)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('address');

    if (!address) {
      return badRequest('Missing required parameter: address');
    }

    // Verify authentication and ensure user can only view their own wins
    await requireMatchingAuth(request, address);

    const { limit, cursor } = parsePaginationParams(searchParams);
    const startKey = cursor ? JSON.parse(decodeCursor(cursor)) : undefined;

    const result = await winnerRepo.getByUser(address, limit, startKey);

    const nextCursor = result.lastKey
      ? encodeCursor(JSON.stringify(result.lastKey))
      : undefined;

    return paginated(result.items, !!result.lastKey, nextCursor);
  } catch (error) {
    return handleError(error);
  }
}
