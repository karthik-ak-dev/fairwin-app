import { NextResponse } from 'next/server';
import { isValidWalletAddress, isPositiveNumber, isValidRaffleType, raffle } from '@/lib/constants';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

// Re-export from constants for backward compatibility
export { isValidWalletAddress as isValidAddress, isPositiveNumber, isValidRaffleType };

// Re-export raffle types for backward compatibility
export const RAFFLE_TYPES = raffle.TYPES;
