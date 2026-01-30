import { NextRequest, NextResponse } from 'next/server';
import { createEntry } from '@/lib/services/raffle/raffle-entry.service';
import { ServiceError } from '@/lib/services/errors';

/**
 * POST /api/raffles/[id]/enter
 *
 * Create a new raffle entry for a user.
 * All business logic is handled by the service layer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();

    // Extract and validate request body
    const { walletAddress, numEntries, totalPaid, transactionHash, blockNumber } = body;

    if (!walletAddress || !numEntries || !totalPaid || !transactionHash || blockNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, numEntries, totalPaid, transactionHash, blockNumber' },
        { status: 400 }
      );
    }

    // Call service to create entry (all validation and business logic handled there)
    const result = await createEntry({
      raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber,
    });

    return NextResponse.json({ entry: result }, { status: 201 });
  } catch (error) {
    // Handle service errors
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error('POST /api/raffles/[id]/enter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
