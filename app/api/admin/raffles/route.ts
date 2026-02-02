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
 * DATABASE-ONLY: Creates raffle directly in database (no blockchain interaction)
 *
 * Body:
 * - type: Raffle type (daily, weekly, mega, flash, monthly)
 * - title: Raffle title
 * - description: Raffle description (optional)
 * - entryPrice: Price per entry in USDC (smallest unit, 6 decimals)
 * - winnerCount: Number of winners (default 100)
 * - platformFeePercent: Platform fee percentage (default 5%)
 * - prizeTiers: Prize tier configuration (optional, uses default 3-tier if not provided)
 * - startTime: Start timestamp (ISO 8601 string)
 * - endTime: End timestamp (ISO 8601 string)
 *
 * Prize Tiers Example:
 * [
 *   { name: "Tier 1 - Grand Prize", percentage: 40, winnerCount: 1 },
 *   { name: "Tier 2 - Top Winners", percentage: 30, winnerCount: 4 },
 *   { name: "Tier 3 - Lucky Winners", percentage: 30, winnerCount: 95 }
 * ]
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
      winnerCount,
      platformFeePercent,
      prizeTiers,
      startTime,
      endTime,
    } = body;

    // Basic validation - service layer handles detailed validation
    if (!type || !title || !entryPrice || !startTime || !endTime) {
      return badRequest('Missing required fields: type, title, entryPrice, startTime, endTime');
    }

    // Create raffle in database with tiered rewards
    // Service layer applies defaults and validates complete configuration
    const raffleData = await createRaffle({
      type,
      title,
      description,
      entryPrice,
      winnerCount,
      platformFeePercent,
      prizeTiers,
      startTime,
      endTime,
    });

    return created({ raffle: raffleData });
  } catch (error) {
    return handleError(error);
  }
}
