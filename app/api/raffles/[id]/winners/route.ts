import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { listWinners } from '@/lib/services/raffle/raffle-query.service';
import { PayoutStatus } from '@/lib/db/models';
import { pagination } from '@/lib/constants';

/**
 * GET /api/raffles/[id]/winners
 *
 * Get winners for a raffle with optional filtering and pagination
 * Public endpoint - no authentication required
 *
 * Path params:
 * - id: Raffle ID (use "all" to query across all raffles)
 *
 * Query params:
 * - payoutStatus: Filter by payout status (pending, paid, failed, processing)
 * - limit: Number of items per page (optional, default: 20)
 * - cursor: Pagination cursor (optional)
 *
 * Returns:
 * - winners: Array of winner items with full details
 * - nextCursor: Cursor for next page (if more results exist)
 * - hasMore: Boolean indicating if more results exist
 *
 * Examples:
 * - GET /api/raffles/raffle-123/winners - Get all winners for raffle-123
 * - GET /api/raffles/all/winners?payoutStatus=pending - Get all pending payouts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;

    const limit = parseInt(searchParams.get('limit') || String(pagination.USER_LIST_LIMIT), 10);
    const cursor = searchParams.get('cursor') || undefined;
    const payoutStatus = searchParams.get('payoutStatus') as PayoutStatus | null;

    const result = await listWinners({
      raffleId: id === 'all' ? undefined : id,
      payoutStatus: payoutStatus || undefined,
      limit,
      cursor,
    });

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
