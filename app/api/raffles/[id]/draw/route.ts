import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { initiateRaffleDraw } from '@/lib/services/raffle/raffle-draw.service';

/**
 * POST /api/raffles/[id]/draw
 *
 * Initiate raffle draw with instant winner selection (admin only)
 *
 * Selects winners immediately using crypto-secure randomness.
 * NO VRF, NO waiting - instant results!
 *
 * Body (optional):
 * - useBlockHash: Use Polygon block hash for seed (verifiable) vs crypto.random (faster)
 *   Default: true (recommended for transparency)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const useBlockHash = body.useBlockHash !== undefined ? body.useBlockHash : true;

    if (typeof useBlockHash !== 'boolean') {
      return badRequest('useBlockHash must be a boolean');
    }

    // Initiate draw (instant winner selection)
    const result = await initiateRaffleDraw(id, useBlockHash);

    return success({
      raffleId: result.raffleId,
      status: result.status,
      winners: result.winners,
      randomSeed: result.randomSeed,
      blockHash: result.blockHash,
      timestamp: result.timestamp,
    });
  } catch (error) {
    return handleError(error);
  }
}
