import { NextRequest, NextResponse } from 'next/server';
import { winnerRepo } from '@/lib/db/repositories';
import { serverError } from '@/lib/api/validate';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const winners = await winnerRepo.getByRaffle(id);
    return NextResponse.json({ winners });
  } catch (error) {
    console.error('GET /api/raffles/[id]/winners error:', error);
    return serverError();
  }
}
