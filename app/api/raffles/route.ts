import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { paginated } from '@/lib/api/responses';
import { listRaffles } from '@/lib/services/raffle/raffle-query.service';
import { pagination } from '@/lib/constants';

/**
 * GET /api/raffles
 *
 * List raffles with optional filtering and pagination
 *
 * Query params:
 * - status: Filter by status (active, scheduled, completed, etc.)
 * - type: Filter by type (daily, weekly, mega, flash, monthly)
 * - limit: Number of items per page (default from constants)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const result = await listRaffles({
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      limit: parseInt(searchParams.get('limit') || String(pagination.DEFAULT_LIMIT), 10),
      cursor: searchParams.get('cursor') || undefined,
    });

    return paginated(result.raffles, result.hasMore, result.nextCursor);
  } catch (error) {
    return handleError(error);
  }
}

