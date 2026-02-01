import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { activateRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * POST /api/admin/raffles/[id]/activate
 *
 * Activate a scheduled raffle (admin only)
 *
 * Can only activate scheduled raffles
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const raffle = await activateRaffle(id);

    return success({ raffle, message: 'Raffle activated successfully' });
  } catch (error) {
    return handleError(error);
  }
}
