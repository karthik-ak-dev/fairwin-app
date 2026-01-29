import { NextRequest, NextResponse } from 'next/server';
import { raffleRepo } from '@/lib/db/repositories';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { badRequest, notFound, serverError } from '@/lib/api/validate';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const { id } = await params;
    const raffle = await raffleRepo.getById(id);
    if (!raffle) return notFound('Raffle not found');

    if (raffle.status !== 'active' && raffle.status !== 'ending') {
      return badRequest(`Cannot draw raffle with status: ${raffle.status}. Must be active or ending.`);
    }

    await raffleRepo.update(id, { status: 'drawing', drawTime: new Date().toISOString() });
    const updated = await raffleRepo.getById(id);

    return NextResponse.json({ raffle: updated });
  } catch (error) {
    console.error('POST /api/raffles/[id]/draw error:', error);
    return serverError();
  }
}
