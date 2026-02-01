import { NextRequest } from 'next/server';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { validateEntryEligibility } from '@/lib/services/raffle/raffle-entry.service';

/**
 * POST /api/raffles/[id]/validate
 *
 * Validate entry eligibility before transaction
 *
 * Useful for frontends to check if a user can enter before submitting USDC payment
 *
 * Body:
 * - walletAddress: User's wallet address
 * - numEntries: Number of entries to validate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();

    const { walletAddress, numEntries } = body;

    if (!walletAddress || !numEntries) {
      return badRequest('Missing required fields: walletAddress, numEntries');
    }

    const result = await validateEntryEligibility(raffleId, walletAddress, numEntries);

    return success({ validation: result });
  } catch (error) {
    return handleError(error);
  }
}
