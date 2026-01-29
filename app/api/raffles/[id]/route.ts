import { NextRequest, NextResponse } from 'next/server';
import { raffleRepo, entryRepo, winnerRepo } from '@/lib/db/repositories';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { notFound, serverError } from '@/lib/api/validate';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raffle = await raffleRepo.getById(id);
    if (!raffle) return notFound('Raffle not found');

    const recentEntries = (await entryRepo.getByRaffle(id, 10)).items;

    let winners;
    if (raffle.status === 'completed') {
      winners = await winnerRepo.getByRaffle(id);
    }

    return NextResponse.json({ raffle, recentEntries, ...(winners && { winners }) });
  } catch (error) {
    console.error('GET /api/raffles/[id] error:', error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const { id } = await params;
    const existing = await raffleRepo.getById(id);
    if (!existing) return notFound('Raffle not found');

    const body = await request.json();
    const { raffleId: _rid, createdAt: _ca, ...allowedUpdates } = body;

    await raffleRepo.update(id, allowedUpdates);
    const updated = await raffleRepo.getById(id);

    return NextResponse.json({ raffle: updated });
  } catch (error) {
    console.error('PATCH /api/raffles/[id] error:', error);
    return serverError();
  }
}
