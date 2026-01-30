import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized, badRequest } from '@/lib/api/error-handler';
import { created, paginated } from '@/lib/api/responses';
import { listRaffles } from '@/lib/services/raffle/raffle-query.service';
import { createRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * GET /api/raffles
 *
 * List raffles with optional filtering and pagination
 *
 * Query params:
 * - status: Filter by status (active, scheduled, completed, etc.)
 * - type: Filter by type (daily, weekly, mega, flash, monthly)
 * - limit: Number of items per page (default: 20)
 * - cursor: Pagination cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const result = await listRaffles({
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      limit: parseInt(searchParams.get('limit') || '20', 10),
      cursor: searchParams.get('cursor') || undefined,
    });

    return paginated(result.raffles, result.hasMore, result.nextCursor);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/raffles
 *
 * Create a new raffle (admin only)
 *
 * Body:
 * - type: Raffle type (daily, weekly, mega, flash, monthly)
 * - title: Raffle title
 * - description: Raffle description (optional)
 * - entryPrice: Price per entry in USDC cents
 * - maxEntriesPerUser: Maximum entries per user (default: 50)
 * - winnerCount: Number of winners (default: 1)
 * - startTime: Start timestamp (milliseconds)
 * - endTime: End timestamp (milliseconds)
 * - platformFeePercent: Platform fee percentage (optional, default: 5)
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      entryPrice,
      maxEntriesPerUser,
      winnerCount,
      startTime,
      endTime,
      platformFeePercent,
    } = body;

    // Validate required fields
    if (!type || !title || !entryPrice || !startTime || !endTime) {
      return badRequest('Missing required fields: type, title, entryPrice, startTime, endTime');
    }

    const raffle = await createRaffle({
      type,
      title,
      description: description || '',
      entryPrice,
      maxEntriesPerUser: maxEntriesPerUser || 50,
      winnerCount: winnerCount || 1,
      startTime,
      endTime,
      platformFeePercent: platformFeePercent || 5,
    });

    return created({ raffle });
  } catch (error) {
    return handleError(error);
  }
}
