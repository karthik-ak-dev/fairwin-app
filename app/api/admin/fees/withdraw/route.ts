/**
 * POST /api/admin/fees/withdraw
 *
 * Withdraw accumulated protocol fees.
 * Admin only - requires admin API key.
 *
 * Body:
 * - recipient: Address to receive fees
 * - amount: Amount to withdraw in USDC (optional, defaults to all)
 * - chainId: Chain ID (optional, defaults to 137)
 *
 * Response:
 * - transactionHash: Blockchain transaction hash
 * - amount: Amount withdrawn
 * - recipient: Recipient address
 * - formatted: Human-readable amount
 *
 * GET /api/admin/fees/withdraw
 *
 * Get available fees for withdrawal.
 * Admin only.
 *
 * Response:
 * - availableFees: Amount available (bigint as string)
 * - formatted: Human-readable amount
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import {
  withdrawFees,
  withdrawAllFees,
  getAvailableFees,
  formatFees,
} from '@/lib/services/admin/admin-fees.service';
import { isValidWalletAddress, errors } from '@/lib/constants';

/**
 * POST /api/admin/fees/withdraw
 *
 * Withdraw protocol fees
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { recipient, amount, chainId = 137 } = body;

    if (!recipient) {
      return badRequest('Missing required field: recipient');
    }

    // Validate recipient address format
    if (!isValidWalletAddress(recipient)) {
      return badRequest(errors.auth.INVALID_ADDRESS);
    }

    let result;

    if (amount) {
      // Withdraw specific amount
      const amountBigInt = BigInt(amount);
      result = await withdrawFees(recipient, amountBigInt, chainId);
    } else {
      // Withdraw all available fees
      result = await withdrawAllFees(recipient, chainId);
    }

    return success({
      withdrawal: {
        transactionHash: result.transactionHash,
        amount: result.amount.toString(),
        recipient: result.recipient,
        timestamp: result.timestamp,
        formatted: formatFees(result.amount),
      },
      message: `Successfully withdrew ${formatFees(result.amount)} to ${recipient}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/admin/fees/withdraw
 *
 * Get available fees for withdrawal
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const chainId = parseInt(searchParams.get('chainId') || '137', 10);

    const available = await getAvailableFees(chainId);

    return success({
      availableFees: available.toString(),
      formatted: formatFees(available),
      message:
        available > BigInt(0)
          ? `${formatFees(available)} available for withdrawal`
          : 'No fees available for withdrawal',
    });
  } catch (error) {
    return handleError(error);
  }
}
