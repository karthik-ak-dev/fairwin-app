import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * POST /api/admin/raffles
 *
 * Create a new raffle (admin only)
 *
 * BLOCKCHAIN-FIRST: Creates raffle on blockchain before saving to database.
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
 * - chainId: Blockchain chain ID (optional, default: 137 for Polygon)
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
      platformFeePercent,
      chainId,
    } = body;

    // Validate required fields
    if (!type || !title || !entryPrice || !startTime || !endTime) {
      return badRequest('Missing required fields: type, title, entryPrice, startTime, endTime');
    }

    const raffle = await createRaffle(
      {
        type,
        title,
        description: description || '',
        entryPrice,
        maxEntriesPerUser: maxEntriesPerUser || 50,
        winnerCount: winnerCount || 1,
        startTime,
        endTime,
        platformFeePercent: platformFeePercent || 5,
      },
      chainId || 137 // Default to Polygon Mainnet
    );

    return created({ raffle });
  } catch (error) {
    return handleError(error);
  }
}
