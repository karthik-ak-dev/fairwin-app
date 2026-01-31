import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { generateChallenge } from '@/lib/services/auth/challenge.service';
import { isValidWalletAddress, CHALLENGE_EXPIRATION_SECONDS, AUTH_ERROR_MESSAGES } from '@/lib/constants/auth.constants';

/**
 * POST /api/auth/challenge
 *
 * Generate a challenge message for wallet signature authentication
 *
 * Body:
 * - address: Wallet address requesting authentication
 *
 * Returns:
 * - challenge: Message to be signed by wallet
 * - expiresIn: Challenge expiration time in seconds (300 = 5 minutes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return badRequest('Missing required field: address');
    }

    // Validate address format
    if (!isValidWalletAddress(address)) {
      return badRequest(AUTH_ERROR_MESSAGES.INVALID_ADDRESS);
    }

    const challenge = generateChallenge(address);

    return success({
      challenge,
      expiresIn: CHALLENGE_EXPIRATION_SECONDS,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to generate challenge');
  }
}
