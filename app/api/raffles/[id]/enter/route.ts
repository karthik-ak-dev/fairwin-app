import { NextRequest, NextResponse } from 'next/server';
import { raffleRepo, entryRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import { badRequest, notFound, serverError, isValidAddress, isPositiveNumber } from '@/lib/api/validate';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { walletAddress, numEntries, totalPaid, transactionHash, blockNumber } = body;

    // Validate required fields
    if (!walletAddress || !numEntries || !totalPaid || !transactionHash || blockNumber === undefined) {
      return badRequest('Missing required fields: walletAddress, numEntries, totalPaid, transactionHash, blockNumber');
    }
    if (!isValidAddress(walletAddress)) return badRequest('Invalid wallet address');
    if (!isPositiveNumber(numEntries)) return badRequest('numEntries must be a positive number');

    // Verify raffle exists and is active
    const raffle = await raffleRepo.getById(id);
    if (!raffle) return notFound('Raffle not found');
    if (raffle.status !== 'active' && raffle.status !== 'ending') {
      return badRequest(`Raffle is not accepting entries (status: ${raffle.status})`);
    }

    // Check max entries per user
    const existingEntries = await entryRepo.getUserEntriesForRaffle(id, walletAddress);
    const currentCount = existingEntries.reduce((sum, e) => sum + e.numEntries, 0);
    if (currentCount + numEntries > raffle.maxEntriesPerUser) {
      return badRequest(`Entry limit exceeded. You have ${currentCount} entries, max is ${raffle.maxEntriesPerUser}`);
    }

    const isNewParticipant = existingEntries.length === 0;

    // Create entry
    const entry = await entryRepo.create({
      raffleId: id,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber,
    });

    // Update all stats atomically
    await Promise.all([
      raffleRepo.incrementEntries(id, numEntries, totalPaid, isNewParticipant),
      userRepo.getOrCreate(walletAddress).then(() => userRepo.incrementEntries(walletAddress, totalPaid, numEntries)),
      statsRepo.incrementEntryStats(totalPaid, isNewParticipant),
    ]);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('POST /api/raffles/[id]/enter error:', error);
    return serverError();
  }
}
