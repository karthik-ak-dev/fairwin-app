import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { winnerRepo, payoutRepo } from '@/lib/db/repositories';
import { serverError } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const raffleId = searchParams.get('raffleId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    let result;
    if (raffleId) {
      // Query winners by raffle
      const items = await winnerRepo.getByRaffle(raffleId, limit, startKey);
      result = { items, lastKey: undefined };
    } else if (status) {
      // Query payouts by status
      result = await payoutRepo.getByStatus(status as any, limit, startKey);
    } else {
      // Default: show pending payouts
      result = await payoutRepo.getByStatus('pending', limit, startKey);
    }

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({
      items: raffleId ? result.items : result.items,
      winners: raffleId ? result.items : undefined,
      payouts: !raffleId ? result.items : undefined,
      nextCursor
    });
  } catch (error) {
    console.error('GET /api/admin/winners error:', error);
    return serverError();
  }
}
