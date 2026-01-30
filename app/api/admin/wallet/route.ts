import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';

/**
 * GET /api/admin/wallet
 *
 * Get admin wallet information (admin only)
 *
 * Returns wallet address and balances
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const adminAddress = process.env.ADMIN_WALLET_ADDRESS || '';

    // TODO: Integrate with blockchain service to fetch real balances
    // For now, return placeholders
    return success({
      address: adminAddress,
      balances: {
        matic: 0,
        usdc: 0,
        link: 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
