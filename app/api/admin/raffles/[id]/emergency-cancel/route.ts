/**
 * POST /api/admin/raffles/[id]/emergency-cancel
 *
 * Emergency cancel raffle stuck in Drawing state.
 * ONLY works if 12+ hours passed since draw triggered.
 *
 * Use Case:
 * - Chainlink VRF fails to respond after draw triggered
 * - Raffle stuck in "drawing" state for 12+ hours
 * - Admin can cancel and refund users
 *
 * Security:
 * - Requires admin API key
 * - Contract enforces 12-hour delay (EMERGENCY_CANCEL_DELAY)
 * - Prevents admin from cancelling just because they don't like winners
 *
 * Body:
 * - chainId: Chain ID (optional, defaults to Polygon Mainnet)
 *
 * Response:
 * - raffle: Updated raffle object
 * - transactionHash: Blockchain transaction hash
 * - message: Success message
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, notFound } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { emergencyCancelDrawing } from '@/lib/services/raffle/raffle-blockchain.service';
import { raffleRepo } from '@/lib/db/repositories';
import { blockchain } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id: raffleId } = await params;
    const body = await request.json();
    const { chainId = blockchain.DEFAULT_CHAIN_ID } = body;

    // Verify raffle exists
    const raffle = await raffleRepo.getById(raffleId);
    if (!raffle) {
      return notFound(`Raffle ${raffleId} not found`);
    }

    // Verify raffle is in drawing state
    if (raffle.status !== 'drawing' && raffle.contractState !== 'drawing') {
      return handleError(
        new Error('Raffle must be in drawing state for emergency cancel')
      );
    }

    // Execute emergency cancel on-chain
    // Contract will verify 12-hour delay has passed
    const result = await emergencyCancelDrawing(raffleId, chainId);

    // Update status in database
    await raffleRepo.update(raffleId, {
      contractState: 'cancelled',
      status: 'cancelled',
    });

    const updatedRaffle = await raffleRepo.getById(raffleId);

    return success({
      raffle: updatedRaffle,
      transactionHash: result.transactionHash,
      message: `Raffle ${raffleId} emergency cancelled (VRF failure). Users can claim refunds.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
