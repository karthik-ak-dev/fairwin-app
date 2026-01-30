import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getRafflePayoutStatus } from '@/lib/services/admin/admin-payout.service';

/**
 * GET /api/admin/raffles/[id]/payouts
 *
 * Get payout status for a raffle (admin only)
 *
 * Returns payout summary and detailed payout records
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const { id } = await params;
    const payoutStatus = await getRafflePayoutStatus(id);

    return success({ payoutStatus });
  } catch (error) {
    return handleError(error);
  }
}
