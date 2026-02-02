import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { cancelRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * POST /api/admin/raffles/[id]/cancel
 *
 * Cancel a raffle (admin only)
 *
 * Cancels raffle in database and marks entries as refunded.
 * Can only cancel raffles that haven't been drawn.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const raffle = await cancelRaffle(id);

    return success({ raffle, message: 'Raffle cancelled successfully' });
  } catch (error) {
    return handleError(error);
  }
}
