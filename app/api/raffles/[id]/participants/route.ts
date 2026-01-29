import { NextRequest, NextResponse } from 'next/server';
import { entryRepo } from '@/lib/db/repositories';
import { serverError } from '@/lib/api/validate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    const result = await entryRepo.getByRaffle(id, limit, startKey);

    // Aggregate entries by wallet
    const participantMap = new Map<string, { walletAddress: string; numEntries: number; totalPaid: number; createdAt: string }>();
    for (const entry of result.items) {
      const existing = participantMap.get(entry.walletAddress);
      if (existing) {
        existing.numEntries += entry.numEntries;
        existing.totalPaid += entry.totalPaid;
        if (entry.createdAt < existing.createdAt) existing.createdAt = entry.createdAt;
      } else {
        participantMap.set(entry.walletAddress, {
          walletAddress: entry.walletAddress,
          numEntries: entry.numEntries,
          totalPaid: entry.totalPaid,
          createdAt: entry.createdAt,
        });
      }
    }

    const participants = Array.from(participantMap.values()).sort((a, b) => b.numEntries - a.numEntries);
    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({ participants, nextCursor });
  } catch (error) {
    console.error('GET /api/raffles/[id]/participants error:', error);
    return serverError();
  }
}
