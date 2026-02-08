// POST /api/cron/verify-stakes - Verify blockchain transactions and activate stakes
// This is a CRON job endpoint protected by API key

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import { getStakesByStatusHelper, activateStake } from '@/lib/utils/stakes';
import { createReferralCommissions } from '@/lib/utils/referrals';
import { verifyBscTransaction } from '@/lib/utils/blockchain';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { constants } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const verifyingStakes = await getStakesByStatusHelper(StakeStatus.VERIFYING);

    if (verifyingStakes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          processed: 0,
          message: 'No stakes to verify',
        },
        { status: 200 }
      );
    }

    const results = [];
    for (const stake of verifyingStakes) {
      try {
        if (!stake.txHash) {
          results.push({
            stakeId: stake.stakeId,
            status: 'error',
            error: 'Missing transaction hash',
          });
          continue;
        }

        const isValid = await verifyBscTransaction(stake.txHash, stake.amount);

        if (!isValid) {
          results.push({
            stakeId: stake.stakeId,
            status: 'invalid_txn',
            error: 'Transaction verification failed',
          });
          continue;
        }

        const activateResult = await activateStake(stake.stakeId);

        if (!activateResult.success) {
          results.push({
            stakeId: stake.stakeId,
            status: 'error',
            error: activateResult.error || 'Failed to activate stake',
          });
          continue;
        }

        const commissionResult = await createReferralCommissions(
          stake.userId,
          stake.stakeId,
          stake.amount,
          constants.DEFAULT_REFERRAL_CONFIG_ID
        );

        results.push({
          stakeId: stake.stakeId,
          status: 'activated',
          commissionsCreated: commissionResult.referrals?.length || 0,
          commissionSuccess: commissionResult.success,
        });
      } catch (error: any) {
        results.push({
          stakeId: stake.stakeId,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'activated').length;
    const failedCount = results.length - successCount;

    return NextResponse.json(
      {
        success: true,
        processed: verifyingStakes.length,
        activated: successCount,
        failed: failedCount,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in verify-stakes cron:', error);
    return NextResponse.json(
      { error: 'Failed to process stakes verification' },
      { status: 500 }
    );
  }
}
