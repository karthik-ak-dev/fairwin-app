import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { initiateRaffleDraw } from '@/lib/services/raffle/raffle-draw.service';

/**
 * POST /api/raffles/[id]/draw
 *
 * Initiate raffle draw (admin only)
 *
 * Triggers the VRF randomness request and updates raffle status to 'drawing'
 *
 * Body (optional):
 * - chainId: Blockchain chain ID (default: 137 for Polygon)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const chainId = body.chainId || 137;

    if (typeof chainId !== 'number') {
      return badRequest('chainId must be a number');
    }

    const result = await initiateRaffleDraw(id, chainId);

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
