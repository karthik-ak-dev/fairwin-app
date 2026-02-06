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
import { submitStakeTxHash } from '@/lib/services/stake/stake-entry.service';
import { getStakeById, getStakeByTxHash } from '@/lib/db/repositories/stake.repository';
import { StakeStatus } from '@/lib/db/models/stake.model';

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

    // 4. Verify stake exists
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return NextResponse.json({ error: 'Stake not found' }, { status: 404 });
    }

    // 5. Verify stake ownership
    if (stake.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this stake' },
        { status: 403 }
      );
    }

    // 6. Verify stake is in PENDING status
    if (stake.status !== StakeStatus.PENDING) {
      return NextResponse.json(
        { error: 'Can only submit txHash for PENDING stakes' },
        { status: 400 }
      );
    }

    // 7. Check for duplicate txHash
    const existingStake = await getStakeByTxHash(txHash);
    if (existingStake) {
      return NextResponse.json(
        { error: 'Transaction hash already used' },
        { status: 400 }
      );
    }

    // 8. Submit txHash and move to VERIFYING
    const result = await submitStakeTxHash(stakeId, txHash);

    if (!result.success || !result.stake) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit transaction hash' },
        { status: 400 }
      );
    }

    // 9. Return updated stake
    return NextResponse.json(
      {
        success: true,
        stake: {
          id: result.stake.stakeId,
          amount: result.stake.amount,
          status: result.stake.status,
          txHash: result.stake.txHash,
          userId: result.stake.userId,
          updatedAt: result.stake.updatedAt,
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
