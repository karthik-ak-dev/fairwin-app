import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getRaffleWinners } from '@/lib/services/raffle/raffle-query.service';

/**
 * GET /api/raffles/[id]/winners
 *
 * Get winners for a completed raffle
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const winners = await getRaffleWinners(id);

    return success({ winners });
  } catch (error) {
    return handleError(error);
  }
}
