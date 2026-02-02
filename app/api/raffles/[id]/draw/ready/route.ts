import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { isRaffleReadyForDraw } from '@/lib/services/raffle/raffle-draw.service';

/**
 * GET /api/raffles/[id]/draw/ready
 *
 * Check if a raffle is ready to be drawn (admin only)
 *
 * Returns:
 * - ready: boolean indicating if raffle can be drawn
 * - reason: optional string explaining why it's not ready
 *
 * Useful for pre-flight checks before actually triggering the draw.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { id } = await params;

    // Check if raffle is ready to draw
    const result = await isRaffleReadyForDraw(id);

    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
