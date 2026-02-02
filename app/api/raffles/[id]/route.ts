import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getRaffleWithDetails } from '@/lib/services/raffle/raffle-query.service';

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
