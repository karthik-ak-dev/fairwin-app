import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createRaffle } from '@/lib/services/raffle/raffle-management.service';
import { blockchain, raffle } from '@/lib/constants';

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
 * - maxEntriesPerUser: Maximum entries per user (default from constants)
 * - winnerCount: Number of winners (default from constants)
 * - startTime: Start timestamp (milliseconds)
 * - endTime: End timestamp (milliseconds)
 * - platformFeePercent: Platform fee percentage (optional, default from constants)
 * - chainId: Blockchain chain ID (optional, default: Polygon Mainnet)
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

    const raffleData = await createRaffle(
      {
        type,
        title,
        description: description || '',
        entryPrice,
        maxEntriesPerUser: maxEntriesPerUser || raffle.DEFAULTS.MAX_ENTRIES_PER_USER,
        winnerCount: winnerCount || raffle.DEFAULTS.WINNER_COUNT,
        startTime,
        endTime,
        platformFeePercent: platformFeePercent || raffle.DEFAULTS.PLATFORM_FEE_PERCENT,
      },
      chainId || blockchain.DEFAULT_CHAIN_ID
    );

    return created({ raffle: raffleData });
  } catch (error) {
    return handleError(error);
  }
}
