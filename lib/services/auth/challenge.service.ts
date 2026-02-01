/**
 * Challenge Service
 *
 * Generates and validates challenge messages for wallet signature verification.
 * Challenges are time-limited and include nonces to prevent replay attacks.
 *
 * Flow:
 * 1. User requests challenge
 * 2. Backend generates challenge with nonce and timestamp
 * 3. User signs challenge with wallet
 * 4. Backend verifies signature and issues JWT token
 */

import { randomBytes } from 'crypto';
import { auth } from '@/lib/constants';

// Store challenges in memory (for MVP - use Redis in production)
const challengeStore = new Map<string, { challenge: string; timestamp: number }>();

/**
 * Generate a challenge message for wallet signature
 *
 * Challenge format:
 * "Sign this message to authenticate with FairWin:
 *  Address: 0x742d35...
 *  Nonce: abc123...
 *  Issued: 2026-01-31T10:30:00.000Z"
 *
 * @param address Wallet address requesting authentication
 * @returns Challenge message to be signed
 */
export function generateChallenge(address: string): string {
  const nonce = randomBytes(32).toString('hex');
  const timestamp = new Date().toISOString();

  const challenge = `Sign this message to authenticate with FairWin:

Address: ${address.toLowerCase()}
Nonce: ${nonce}
Issued: ${timestamp}

This request will expire in 5 minutes.`;

  // Store challenge for verification
  challengeStore.set(address.toLowerCase(), {
    challenge,
    timestamp: Date.now(),
  });

  // Clean up expired challenges
  cleanupExpiredChallenges();

  return challenge;
}

/**
 * Verify that a challenge is valid and not expired
 *
 * @param address Wallet address
 * @param challenge Challenge message that was signed
 * @returns True if challenge is valid and not expired
 */
export function verifyChallenge(address: string, challenge: string): boolean {
  const stored = challengeStore.get(address.toLowerCase());

  if (!stored) {
    return false; // No challenge found
  }

  // Check if challenge matches
  if (stored.challenge !== challenge) {
    return false; // Challenge mismatch
  }

  // Check if challenge is expired
  const age = Date.now() - stored.timestamp;
  if (age > auth.CHALLENGE_EXPIRATION_MS) {
    challengeStore.delete(address.toLowerCase());
    return false; // Challenge expired
  }

  // Challenge is valid - delete it to prevent reuse
  challengeStore.delete(address.toLowerCase());

  return true;
}

/**
 * Clean up expired challenges from store
 */
function cleanupExpiredChallenges(): void {
  const now = Date.now();

  for (const [address, data] of Array.from(challengeStore.entries())) {
    if (now - data.timestamp > auth.CHALLENGE_EXPIRATION_MS) {
      challengeStore.delete(address);
    }
  }
}

