import { NextResponse } from 'next/server';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function isPositiveNumber(n: unknown): n is number {
  return typeof n === 'number' && n > 0 && isFinite(n);
}

export const RAFFLE_TYPES = ['daily', 'weekly', 'mega', 'flash', 'monthly'] as const;

export function isValidRaffleType(type: string): boolean {
  return (RAFFLE_TYPES as readonly string[]).includes(type);
}
