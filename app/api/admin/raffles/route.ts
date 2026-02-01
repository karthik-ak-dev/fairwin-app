import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createRaffle } from '@/lib/services/raffle/raffle-management.service';
import { raffle } from '@/lib/constants';

/**
 * POST /api/admin/raffles
 *
 * Create a new raffle (admin only)
 *
 * DATABASE-ONLY: Creates raffle directly in database (no blockchain interaction)
 *
 * Body:
 * - type: Raffle type (daily, weekly, mega, flash, monthly)
 * - title: Raffle title
 * - description: Raffle description (optional)
 * - entryPrice: Price per entry in USDC (smallest unit, 6 decimals)
 * - maxEntriesPerUser: Maximum entries per user (default from constants)
 * - winnerCount: Number of winners (default from constants)
 * - startTime: Start timestamp (ISO 8601 string)
 * - endTime: End timestamp (ISO 8601 string)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

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
    } = body;

    // Validate required fields
    if (!type || !title || !entryPrice || !startTime || !endTime) {
      return badRequest('Missing required fields: type, title, entryPrice, startTime, endTime');
    }

    // Create raffle in database only (no blockchain)
    const raffleData = await createRaffle({
      type,
      title,
      description: description || '',
      entryPrice,
      maxEntriesPerUser: maxEntriesPerUser || raffle.DEFAULTS.MAX_ENTRIES_PER_USER,
      winnerCount: winnerCount || raffle.DEFAULTS.WINNER_COUNT,
      startTime,
      endTime,
    });

    return created({ raffle: raffleData });
  } catch (error) {
    return handleError(error);
  }
}
