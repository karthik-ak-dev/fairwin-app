import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { cancelRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * POST /api/admin/raffles/[id]/cancel
 *
 * Cancel a raffle (admin only)
 *
 * Can only cancel raffles that haven't been drawn
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
    const raffle = await cancelRaffle(id);

    return success({ raffle, message: 'Raffle cancelled successfully' });
  } catch (error) {
    return handleError(error);
  }
}
