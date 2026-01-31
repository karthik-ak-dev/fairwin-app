import { NextRequest } from 'next/server';
import { handleError, badRequest, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { winnerRepo } from '@/lib/db/repositories';
import { encodeCursor } from '@/lib/services/shared/pagination.service';
import { requireAuth } from '@/lib/api/admin-auth';

/**
 * GET /api/user/wins
 *
 * Get user's wins
 *
 * Requires: Authorization header with valid JWT token
 *
 * Query params:
 * - address: Wallet address (required)
 * - limit: Number of wins per page (default: 50)
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

    // Ensure user can only view their own wins
    if (authenticatedAddress.toLowerCase() !== address.toLowerCase()) {
      return unauthorized('You can only view your own wins');
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    const result = await winnerRepo.getByUser(address, limit, startKey);

    const nextCursor = result.lastKey
      ? encodeCursor(JSON.stringify(result.lastKey))
      : undefined;

    return success({
      wins: result.items,
      pagination: {
        nextCursor,
        hasMore: !!result.lastKey,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized(error.message);
    }
    return handleError(error);
  }
}
