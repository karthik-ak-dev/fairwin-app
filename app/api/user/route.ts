import { NextRequest, NextResponse } from 'next/server';
import { userRepo } from '@/lib/db/repositories';
import { badRequest, serverError, isValidAddress } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');
    if (!address) return badRequest('Missing required parameter: address');
    if (!isValidAddress(address)) return badRequest('Invalid wallet address');

    const user = await userRepo.getOrCreate(address);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/user error:', error);
    return serverError();
  }
}
