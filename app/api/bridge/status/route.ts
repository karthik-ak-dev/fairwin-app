import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { waitForBridge } from '@/lib/services/raffle/raffle-entry-bridge.service';

/**
 * GET /api/bridge/status
 *
 * Check bridge transaction status
 *
 * Query params:
 * - sourceTxHash: Source chain transaction hash
 * - fromChainId: Source chain ID
 * - toChainId: Destination chain ID (optional, defaults to 137 for Polygon)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sourceTxHash = searchParams.get('sourceTxHash');
    const fromChainIdStr = searchParams.get('fromChainId');
    const toChainIdStr = searchParams.get('toChainId');

    if (!sourceTxHash || !fromChainIdStr) {
      return badRequest('Missing required query params: sourceTxHash, fromChainId');
    }

    const fromChainId = parseInt(fromChainIdStr, 10);
    const toChainId = toChainIdStr ? parseInt(toChainIdStr, 10) : 137;

    if (isNaN(fromChainId) || isNaN(toChainId)) {
      return badRequest('fromChainId and toChainId must be valid numbers');
    }

    // Wait for bridge completion (will poll and wait)
    const status = await waitForBridge(sourceTxHash, fromChainId, toChainId);

    return success({
      sourceTxHash,
      fromChainId,
      toChainId,
      status: status.destinationTxStatus,
      destinationTxHash: status.destinationTxHash,
      completed: status.destinationTxStatus === 'COMPLETED',
    });
  } catch (error) {
    return handleError(error);
  }
}
