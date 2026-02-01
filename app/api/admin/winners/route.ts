import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { winnerRepo, payoutRepo } from '@/lib/db/repositories';
import { encodeCursor, decodeCursor } from '@/lib/services/shared/pagination.service';
import { pagination } from '@/lib/constants';

/**
 * GET /api/admin/winners
 *
 * Get winners or payouts with filtering (admin only)
 *
 * Query params:
 * - raffleId: Filter winners by raffle ID
 * - status: Filter payouts by status (pending, paid, failed)
 * - limit: Number of items per page (default from constants)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const raffleId = searchParams.get('raffleId');
    const limit = parseInt(searchParams.get('limit') || String(pagination.USER_LIST_LIMIT), 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(decodeCursor(cursor)) : undefined;

    let result;
    let responseKey: string;

    if (raffleId) {
      // Query winners by raffle
      result = await winnerRepo.getByRaffle(raffleId, limit, startKey);
      responseKey = 'winners';
    } else if (status) {
      // Query payouts by status
      result = await payoutRepo.getByStatus(status as any, limit, startKey);
      responseKey = 'payouts';
    } else {
      // Default: show pending payouts
      result = await payoutRepo.getByStatus('pending', limit, startKey);
      responseKey = 'payouts';
    }

    const nextCursor = result.lastKey ? encodeCursor(JSON.stringify(result.lastKey)) : undefined;

    return success({
      [responseKey]: result.items,
      pagination: {
        nextCursor,
        hasMore: !!result.lastKey,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
