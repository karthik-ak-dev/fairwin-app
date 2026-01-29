import { NextRequest, NextResponse } from 'next/server';
import { raffleRepo, statsRepo } from '@/lib/db/repositories';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { badRequest, serverError, isValidRaffleType, isPositiveNumber } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || 'active';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');
    const startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    const result = type
      ? await raffleRepo.getByType(type, limit, startKey)
      : await raffleRepo.getByStatus(status, limit, startKey);

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return NextResponse.json({ raffles: result.items, nextCursor });
  } catch (error) {
    console.error('GET /api/raffles error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const body = await request.json();
    const { type, title, description, entryPrice, maxEntriesPerUser, startTime, endTime } = body;

    if (!type || !title || !entryPrice || !startTime || !endTime) {
      return badRequest('Missing required fields: type, title, entryPrice, startTime, endTime');
    }
    if (!isValidRaffleType(type)) {
      return badRequest(`Invalid type. Must be one of: daily, weekly, mega, flash, monthly`);
    }
    if (!isPositiveNumber(entryPrice)) {
      return badRequest('entryPrice must be a positive number');
    }

    const raffle = await raffleRepo.create({
      type,
      title,
      description: description || '',
      entryPrice,
      maxEntriesPerUser: maxEntriesPerUser || 50,
      startTime,
      endTime,
    });

    await statsRepo.incrementRaffleCount();

    return NextResponse.json({ raffle }, { status: 201 });
  } catch (error) {
    console.error('POST /api/raffles error:', error);
    return serverError();
  }
}
