// POST /api/stakes/submit-txhash - Submit transaction hash for pending stake
// Responsibilities:
// - Authenticate user via JWT
// - Receive stakeId and txHash
// - Verify stake ownership
// - Verify stake is in PENDING status
// - Check for duplicate txHash
// - Update stake with txHash and move to VERIFYING status
// - Return updated stake object

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth.service';
import { submitStakeTxHashWithValidation } from '@/lib/services/stake/stake-entry.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { stakeId, txHash } = body;

    // 3. Input validation
    if (!stakeId || !txHash) {
      return NextResponse.json(
        { error: 'stakeId and txHash are required' },
        { status: 400 }
      );
    }

    if (typeof stakeId !== 'string' || typeof txHash !== 'string') {
      return NextResponse.json(
        { error: 'stakeId and txHash must be strings' },
        { status: 400 }
      );
    }

    // 4. Submit txHash with full validation (ownership, status, duplicate check)
    const result = await submitStakeTxHashWithValidation(stakeId, txHash, user.userId);

    if (!result.success) {
      // Determine appropriate status code based on error
      const status = result.error?.includes('Not authorized') ? 403 :
                     result.error?.includes('not found') ? 404 : 400;

      return NextResponse.json(
        { error: result.error || 'Failed to submit transaction hash' },
        { status }
      );
    }

    // 5. Return updated stake
    return NextResponse.json(
      {
        success: true,
        stake: {
          id: result.stake!.stakeId,
          amount: result.stake!.amount,
          status: result.stake!.status,
          txHash: result.stake!.txHash,
          userId: result.stake!.userId,
          updatedAt: result.stake!.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting transaction hash:', error);

    return NextResponse.json(
      { error: 'Failed to submit transaction hash' },
      { status: 500 }
    );
  }
}
