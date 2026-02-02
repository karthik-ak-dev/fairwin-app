import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { winnerRepo } from '@/lib/db/repositories';
import { PayoutStatus } from '@/lib/db/models';
import { encodeCursor, decodeCursor } from '@/lib/services/shared/pagination.service';
import { pagination } from '@/lib/constants';

/**
 * GET /api/admin/winners
 *
 * Get winners with filtering by raffle or payout status (admin only)
 *
 * Query params:
 * - raffleId: Filter winners by raffle ID
 * - payoutStatus: Filter winners by payout status (pending, paid, failed, processing)
 * - limit: Number of items per page (default from constants)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const payoutStatus = searchParams.get('payoutStatus');
    const raffleId = searchParams.get('raffleId');
    const limit = parseInt(searchParams.get('limit') || String(pagination.USER_LIST_LIMIT), 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(decodeCursor(cursor)) : undefined;

    let result;

    if (raffleId) {
      // Query winners by raffle
      result = await winnerRepo.getByRaffle(raffleId, limit, startKey);
    } else if (payoutStatus) {
      // Query winners by payout status
      result = await winnerRepo.getByPayoutStatus(payoutStatus as PayoutStatus, limit, startKey);
    } else {
      // Default: show pending payouts
      result = await winnerRepo.getByPayoutStatus(PayoutStatus.PENDING, limit, startKey);
    }

    const nextCursor = result.lastKey ? encodeCursor(JSON.stringify(result.lastKey)) : undefined;

    return success({
      winners: result.items,
      pagination: {
        nextCursor,
        hasMore: !!result.lastKey,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
