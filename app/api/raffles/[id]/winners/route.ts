import { NextRequest } from 'next/server';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { winnerRepo } from '@/lib/db/repositories';

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
    const result = await winnerRepo.getByRaffle(id);

    return success({ winners: result.items });
  } catch (error) {
    return handleError(error);
  }
}
