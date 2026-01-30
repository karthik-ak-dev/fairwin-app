import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { aggregateParticipants } from '@/lib/services/raffle/raffle-participant.service';

/**
 * GET /api/raffles/[id]/participants
 *
 * Get aggregated participants for a raffle (sorted by entry count)
 *
 * Query params:
 * - limit: Number of participants per page (default: 50)
 * - cursor: Pagination cursor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;

    const result = await aggregateParticipants(id, {
      limit: parseInt(searchParams.get('limit') || '50', 10),
      cursor: searchParams.get('cursor') || undefined,
    });

    return paginated(
      result.participants,
      result.hasMore,
      result.nextCursor,
      result.totalParticipants
    );
  } catch (error) {
    return handleError(error);
  }
}
