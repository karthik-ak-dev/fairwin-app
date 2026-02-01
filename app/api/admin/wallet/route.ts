import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getTokenBalances } from '@/lib/services/blockchain/contract-read.service';
import { env, serverEnv } from '@/lib/env';

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
    await requireAdmin(request);

    const adminAddress = serverEnv.ADMIN_WALLET_ADDRESS;

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
    const chainId = parseInt(searchParams.get('chainId') || String(env.CHAIN_ID), 10);

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
