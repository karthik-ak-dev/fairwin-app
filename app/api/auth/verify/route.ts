import { NextRequest } from 'next/server';
import { badRequest, handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { verifyChallenge } from '@/lib/services/auth/challenge.service';
import { verifyWalletSignature } from '@/lib/services/auth/signature.service';
import { generateToken, getExpirationSeconds } from '@/lib/services/auth/jwt.service';
import { isValidWalletAddress, errors } from '@/lib/constants';
import { serverEnv } from '@/lib/env';

/**
 * POST /api/auth/verify
 *
 * Verify wallet signature and issue JWT token
 *
 * Body:
 * - address: Wallet address
 * - challenge: Original challenge message that was signed
 * - signature: Signature from wallet
 *
 * Returns:
 * - token: JWT token for authenticated requests
 * - expiresIn: Token expiration time in seconds (86400 = 24 hours)
 * - address: Authenticated wallet address
 * - isAdmin: Whether this wallet is an admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, challenge, signature } = body;

    // Validate required fields
    if (!address || !challenge || !signature) {
      return badRequest('Missing required fields: address, challenge, signature');
    }

    // Validate address format
    if (!isValidWalletAddress(address)) {
      return badRequest(errors.auth.INVALID_ADDRESS);
    }

    // Verify challenge is valid and not expired
    const isChallengeValid = verifyChallenge(address, challenge);
    if (!isChallengeValid) {
      return badRequest(errors.auth.EXPIRED_CHALLENGE);
    }

    // Verify signature
    const isSignatureValid = await verifyWalletSignature(address, challenge, signature);
    if (!isSignatureValid) {
      return badRequest(errors.auth.INVALID_SIGNATURE);
    }

    // Check if user is admin
    const adminAddress = serverEnv.ADMIN_WALLET_ADDRESS;
    const isAdmin = !!adminAddress && address.toLowerCase() === adminAddress.toLowerCase();

    // Generate JWT token
    const token = await generateToken(address, isAdmin);

    return success({
      token,
      expiresIn: getExpirationSeconds(),
      address: address.toLowerCase(),
      isAdmin,
    });
  } catch (error) {
    return handleError(error);
  }
}
