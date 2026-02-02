import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { created } from '@/lib/api/responses';
import { createEntry } from '@/lib/services/raffle/raffle-entry.service';
import { requireMatchingAuth } from '@/lib/api/auth';

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
 * 3. USDC transfer verification on blockchain (prevents fake entries)
 *
 * Body:
 * - walletAddress: User's wallet address
 * - numEntries: Number of entries to create
 * - totalPaid: Total amount paid in USDC (smallest unit, 6 decimals)
 * - transactionHash: USDC transfer transaction hash
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();

    const { walletAddress, numEntries, totalPaid, transactionHash } = body;

    if (!walletAddress || !numEntries || !totalPaid || !transactionHash) {
      return badRequest('Missing required fields: walletAddress, numEntries, totalPaid, transactionHash');
    }

    // SECURITY LAYER 1 & 2: Verify JWT token and ensure it matches wallet address
    await requireMatchingAuth(request, walletAddress);

    // SECURITY LAYER 3: USDC transfer verification happens in createEntry service
    const result = await createEntry({
      raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
    });

    return created({ entry: result });
  } catch (error) {
    return handleError(error);
  }
}
