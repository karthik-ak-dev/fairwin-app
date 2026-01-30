import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getRaffleWithDetails } from '@/lib/services/raffle/raffle-query.service';
import { updateRaffle } from '@/lib/services/raffle/raffle-management.service';

/**
 * GET /api/raffles/[id]
 *
 * Get raffle details with enriched data (recent entries, winners if completed)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getRaffleWithDetails(id);

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/raffles/[id]
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
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    const { raffleId: _rid, createdAt: _ca, ...updates } = body;

    const raffle = await updateRaffle(id, updates);

    return success({ raffle });
  } catch (error) {
    return handleError(error);
  }
}
