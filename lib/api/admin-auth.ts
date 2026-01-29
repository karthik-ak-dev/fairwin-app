import { NextResponse } from 'next/server';

export function isAdmin(request: Request): boolean {
  const wallet = request.headers.get('x-wallet-address');
  const admin = process.env.ADMIN_WALLET_ADDRESS;
  if (!admin || !wallet) return false;
  return wallet.toLowerCase() === admin.toLowerCase();
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
