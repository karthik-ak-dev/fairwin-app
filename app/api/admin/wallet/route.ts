import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getTokenBalances } from '@/lib/services/blockchain/contract-read.service';

/**
 * GET /api/admin/wallet
 *
 * Get admin wallet information (admin only)
 *
 * Returns wallet address and token balances (MATIC, USDC, LINK)
 *
 * Query params:
 * - chainId: Blockchain chain ID (optional, default: 137 for Polygon)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const adminAddress = process.env.ADMIN_WALLET_ADDRESS || '';

    if (!adminAddress) {
      return success({
        address: '',
        balances: {
          matic: '0',
          usdc: '0',
          link: '0',
        },
        error: 'Admin wallet address not configured',
      });
    }

    const { searchParams } = request.nextUrl;
    const chainId = parseInt(searchParams.get('chainId') || '137', 10);

    // Fetch token balances from blockchain
    const balances = await getTokenBalances(adminAddress, chainId);

    return success({
      address: adminAddress,
      balances: {
        matic: balances.matic.toString(),
        usdc: balances.usdc.toString(),
        link: balances.link.toString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
