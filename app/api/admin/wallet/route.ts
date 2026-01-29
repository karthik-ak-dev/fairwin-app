import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { serverError } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const adminAddress = process.env.ADMIN_WALLET_ADDRESS || '';

    // Actual chain reads come in a later phase; return placeholders for now
    return NextResponse.json({
      address: adminAddress,
      maticBalance: 0,
      usdcBalance: 0,
      linkBalance: 0,
    });
  } catch (error) {
    console.error('GET /api/admin/wallet error:', error);
    return serverError();
  }
}
