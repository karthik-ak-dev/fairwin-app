import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { updateRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * PATCH /api/admin/raffles/[id]
 *
 * Update raffle (admin only)
 *
 * Body: Partial raffle fields to update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    const { raffleId: _rid, createdAt: _ca, updatedAt: _ua, ...updates } = body;

    const raffle = await updateRaffle(id, updates);

    return success({ raffle });
  } catch (error) {
    return handleError(error);
  }
}
