import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { payoutRepo } from '@/lib/db/repositories';
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
      result = await payoutRepo.getByRaffle(raffleId, limit, startKey);
    } else if (status) {
      result = await payoutRepo.getByStatus(status, limit, startKey);
    } else {
      // Default: show pending payouts
      result = await payoutRepo.getByStatus('pending', limit, startKey);
    }

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({ payouts: result.items, nextCursor });
  } catch (error) {
    console.error('GET /api/admin/winners error:', error);
    return serverError();
  }
}
