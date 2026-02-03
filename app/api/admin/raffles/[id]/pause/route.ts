import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { pauseRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * POST /api/admin/raffles/[id]/pause
 *
 * Pause an active raffle (admin only)
 *
 * Pauses the raffle temporarily - no new entries can be made.
 * Can be resumed using the activate endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const raffle = await pauseRaffle(id);

    return success({ raffle, message: 'Raffle paused successfully' });
  } catch (error) {
    return handleError(error);
  }
}
