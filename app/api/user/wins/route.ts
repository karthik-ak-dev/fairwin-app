import { NextRequest, NextResponse } from 'next/server';
import { winnerRepo } from '@/lib/db/repositories';
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

    const result = await winnerRepo.getByUser(address, limit, startKey);
    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({ wins: result.items, nextCursor });
  } catch (error) {
    console.error('GET /api/user/wins error:', error);
    return serverError();
  }
}
