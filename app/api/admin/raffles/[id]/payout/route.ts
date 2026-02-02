import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import {
  sendAllPayouts,
  sendPayoutToWinner,
  getPayoutStatus,
} from '@/lib/services/admin/admin-payout.service';

/**
 * POST /api/admin/raffles/[id]/payout
 *
 * Send USDC payouts to raffle winners (admin only)
 *
 * Body (optional):
 * - winnerId: Specific winner ID to pay (if not provided, pays all pending winners)
 * - chainId: Chain ID (default: from env)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { id: raffleId } = await params;
    const body = await request.json().catch(() => ({}));
    const { winnerId, chainId } = body;

    // Send payout to specific winner or all winners
    if (winnerId) {
      const result = await sendPayoutToWinner(winnerId, chainId);
      return success({
        type: 'single',
        payout: result,
      });
    } else {
      const result = await sendAllPayouts(raffleId, chainId);
      return success({
        type: 'batch',
        ...result,
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/admin/raffles/[id]/payout
 *
 * Get payout status for a raffle (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id: raffleId } = await params;
    const status = await getPayoutStatus(raffleId);

    return success(status);
  } catch (error) {
    return handleError(error);
  }
}
