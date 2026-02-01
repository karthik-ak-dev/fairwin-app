import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { cancelRaffle } from '@/lib/services/raffle/raffle-management.service';
import { blockchain } from '@/lib/constants';

/**
 * POST /api/admin/raffles/[id]/cancel
 *
 * Cancel a raffle (admin only)
 *
 * BLOCKCHAIN-FIRST: Cancels raffle on blockchain before updating database.
 *
 * Can only cancel raffles that haven't been drawn
 *
 * Body (optional):
 * - chainId: Blockchain chain ID (default: Polygon Mainnet)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const chainId = body.chainId || blockchain.DEFAULT_CHAIN_ID;

    if (typeof chainId !== 'number') {
      return badRequest('chainId must be a number');
    }

    const raffle = await cancelRaffle(id, chainId);

    return success({ raffle, message: 'Raffle cancelled successfully' });
  } catch (error) {
    return handleError(error);
  }
}
