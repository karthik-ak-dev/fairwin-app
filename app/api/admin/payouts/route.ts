import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import {
  getAllPayouts,
  triggerRafflePayouts,
  retryFailedPayout,
  retryAllFailedPayouts,
  getPayoutOverview,
  cancelPendingPayout,
} from '@/lib/services/admin/admin-payout.service';

/**
 * GET /api/admin/payouts
 *
 * Get all payouts or payout overview (admin only)
 *
 * Query params:
 * - status: Filter by status (pending, paid, failed) (optional)
 * - overview: Set to 'true' to get overview instead of list
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') as 'pending' | 'paid' | 'failed' | null;
    const overview = searchParams.get('overview') === 'true';

    if (overview) {
      const data = await getPayoutOverview();
      return success({ overview: data });
    }

    const payouts = await getAllPayouts(status || undefined);
    return success({ payouts });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/admin/payouts
 *
 * Trigger payout operations (admin only)
 *
 * Body:
 * - action: 'process' | 'retry' | 'retryAll' | 'cancel'
 * - raffleId: Raffle ID (required for 'process')
 * - payoutId: Payout ID (required for 'retry' and 'cancel')
 * - chainId: Chain ID (optional, default: 137)
 * - reason: Cancellation reason (required for 'cancel')
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const body = await request.json();
    const { action, raffleId, payoutId, chainId = 137, reason } = body;

    if (!action) {
      return badRequest('Missing required field: action');
    }

    switch (action) {
      case 'process': {
        if (!raffleId) {
          return badRequest('Missing required field: raffleId');
        }
        const result = await triggerRafflePayouts(raffleId, chainId);
        return success({ result, message: 'Payouts processing initiated' });
      }

      case 'retry': {
        if (!payoutId) {
          return badRequest('Missing required field: payoutId');
        }
        const result = await retryFailedPayout(payoutId, chainId);
        return success({ result, message: 'Payout retry initiated' });
      }

      case 'retryAll': {
        const result = await retryAllFailedPayouts(chainId);
        return success({
          result,
          message: `Retry completed: ${result.successful} successful, ${result.failed} failed`,
        });
      }

      case 'cancel': {
        if (!payoutId) {
          return badRequest('Missing required field: payoutId');
        }
        if (!reason) {
          return badRequest('Missing required field: reason');
        }
        await cancelPendingPayout(payoutId, reason);
        return success({ message: 'Payout cancelled' });
      }

      default:
        return badRequest(`Invalid action: ${action}`);
    }
  } catch (error) {
    return handleError(error);
  }
}
