import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getBridgeQuoteForEntry, estimateBridgeCost } from '@/lib/services/raffle/raffle-entry-bridge.service';
import { raffleRepo } from '@/lib/db/repositories';
import { blockchain } from '@/lib/constants';

/**
 * POST /api/bridge/quote
 *
 * Get bridge quote for raffle entry
 *
 * Body:
 * - raffleId: Raffle to enter
 * - fromChainId: Source chain ID
 * - fromTokenAddress: Source token address
 * - numEntries: Number of raffle entries to purchase
 * - userAddress: User's wallet address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      raffleId,
      fromChainId,
      fromTokenAddress,
      numEntries,
      userAddress,
    } = body;

    // Validate required fields
    if (!raffleId || !fromChainId || !fromTokenAddress || !numEntries || !userAddress) {
      return badRequest('Missing required fields: raffleId, fromChainId, fromTokenAddress, numEntries, userAddress');
    }

    if (typeof fromChainId !== 'number') {
      return badRequest('fromChainId must be a number');
    }

    if (typeof numEntries !== 'number' || numEntries < 1) {
      return badRequest('numEntries must be a positive number');
    }

    // Get raffle to get entry price
    const raffle = await raffleRepo.getById(raffleId);
    if (!raffle) {
      return badRequest(`Raffle ${raffleId} not found`);
    }

    // Get bridge quote
    const estimate = await estimateBridgeCost(
      fromChainId,
      fromTokenAddress,
      raffle.entryPrice,
      numEntries,
      userAddress,
      blockchain.DEFAULT_CHAIN_ID
    );

    return success({
      raffleId,
      entryPrice: raffle.entryPrice,
      numEntries,
      totalUSDCNeeded: estimate.totalUSDCNeeded,
      estimatedSourceAmount: estimate.estimatedSourceAmount,
      estimatedGasUsd: estimate.estimatedGasUsd,
      route: estimate.route,
    });
  } catch (error) {
    return handleError(error);
  }
}
