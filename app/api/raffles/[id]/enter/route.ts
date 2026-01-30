import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createEntry } from '@/lib/services/raffle/raffle-entry.service';

/**
 * POST /api/raffles/[id]/enter
 *
 * Create a new raffle entry for a user
 *
 * Body:
 * - walletAddress: User's wallet address
 * - numEntries: Number of entries to create
 * - totalPaid: Total amount paid in USDC cents
 * - transactionHash: Blockchain transaction hash
 * - blockNumber: Block number of the transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();

    const { walletAddress, numEntries, totalPaid, transactionHash, blockNumber } = body;

    if (!walletAddress || !numEntries || !totalPaid || !transactionHash || blockNumber === undefined) {
      return badRequest('Missing required fields: walletAddress, numEntries, totalPaid, transactionHash, blockNumber');
    }

    const result = await createEntry({
      raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber,
    });

    return created({ entry: result });
  } catch (error) {
    return handleError(error);
  }
}
