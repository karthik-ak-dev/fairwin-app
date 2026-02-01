/**
 * Signature Verification Service
 *
 * Verifies wallet signatures using viem's verifyMessage.
 * Ensures that the signer owns the claimed wallet address.
 */

import { verifyMessage } from 'viem';
import type { Address } from 'viem';

/**
 * Verify that a signature was created by the claimed wallet address
 *
 * @param address Claimed wallet address
 * @param message Original message that was signed
 * @param signature Signature produced by wallet
 * @returns True if signature is valid for the address
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as Address,
      message,
      signature: signature as `0x${string}`,
    });

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

