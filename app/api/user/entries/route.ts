import { NextRequest, NextResponse } from 'next/server';
import { entryRepo, raffleRepo } from '@/lib/db/repositories';
import { badRequest, serverError, isValidAddress } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('address');
    if (!address) return badRequest('Missing required parameter: address');
    if (!isValidAddress(address)) return badRequest('Invalid wallet address');

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    const result = await entryRepo.getByUser(address, limit, startKey);

    // Enrich entries with raffle info
    const raffleCache = new Map<string, { title: string; type: string }>();
    const enrichedEntries = await Promise.all(
      result.items.map(async (entry) => {
        let raffleInfo = raffleCache.get(entry.raffleId);
        if (!raffleInfo) {
          const raffle = await raffleRepo.getById(entry.raffleId);
          raffleInfo = raffle ? { title: raffle.title, type: raffle.type } : { title: 'Unknown Raffle', type: 'daily' };
          raffleCache.set(entry.raffleId, raffleInfo);
        }
        return {
          id: entry.entryId,
          raffleId: entry.raffleId,
          raffleTitle: raffleInfo.title,
          raffleType: raffleInfo.type,
          entriesCount: entry.numEntries,
          totalAmount: entry.totalPaid,
          status: entry.status === 'confirmed' ? 'active' : entry.status,
          timestamp: entry.createdAt,
          txHash: entry.transactionHash,
        };
      })
    );

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({ entries: enrichedEntries, nextCursor });
  } catch (error) {
    console.error('GET /api/user/entries error:', error);
    return serverError();
  }
}
