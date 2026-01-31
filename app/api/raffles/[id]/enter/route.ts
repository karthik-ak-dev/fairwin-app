import { NextRequest } from 'next/server';
import { handleError, badRequest, unauthorized } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createEntry } from '@/lib/services/raffle/raffle-entry.service';
import { requireAuth } from '@/lib/api/admin-auth';

/**
 * POST /api/raffles/[id]/enter
 *
 * Create a new raffle entry for a user
 *
 * Requires: Authorization header with valid JWT token
 *
 * Security Layers:
 * 1. JWT token verification (proves wallet ownership via signature)
 * 2. Token address must match walletAddress in body
 * 3. Transaction verification on blockchain (prevents fake entries)
 *
 * Body:
 * - walletAddress: User's wallet address
 * - numEntries: Number of entries to create
 * - totalPaid: Total amount paid in USDC cents
 * - transactionHash: Blockchain transaction hash
 * - blockNumber: Block number (optional, will be verified from blockchain)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();

    const { walletAddress, numEntries, totalPaid, transactionHash, blockNumber } = body;

    if (!walletAddress || !numEntries || !totalPaid || !transactionHash) {
      return badRequest('Missing required fields: walletAddress, numEntries, totalPaid, transactionHash');
    }

    // SECURITY LAYER 1: Verify JWT token
    const authenticatedAddress = await requireAuth(request);

    // SECURITY LAYER 2: Ensure token matches wallet address
    if (authenticatedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return unauthorized('Authenticated wallet does not match request wallet address');
    }

    // SECURITY LAYER 3: Transaction verification happens in createEntry service
    const result = await createEntry({
      raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber: blockNumber || 0, // Will be replaced by verified block number
    });

    return created({ entry: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized(error.message);
    }
    return handleError(error);
  }
}
