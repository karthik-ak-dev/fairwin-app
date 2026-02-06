// POST /api/cron/verify-stakes - Verify blockchain transactions and activate stakes
// This is a CRON job endpoint protected by API key
// Responsibilities:
// - Validate API key
// - Get all VERIFYING stakes
// - Verify each transaction on BSC blockchain
// - Activate valid stakes (sets startDate, endDate, status=ACTIVE)
// - Create referral commissions (L1-L5) for activated stakes
// - Return processing results

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import { getStakesByStatus } from '@/lib/db/repositories/stake.repository';
import { activateStake } from '@/lib/services/stake/stake-entry.service';
import { createReferralCommissions } from '@/lib/services/referral/referral.service';
import { verifyBscTransaction } from '@/lib/services/blockchain/bsc.service';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { constants } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for cron job

export async function POST(request: NextRequest) {
  try {
    // 1. API Key Authentication
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // 2. Get all VERIFYING stakes
    const verifyingStakes = await getStakesByStatus(StakeStatus.VERIFYING);

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

    // 3. Process each stake
    const results = [];
    for (const stake of verifyingStakes) {
      try {
        // 4. Verify blockchain transaction
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

        // 5. Activate stake (sets startDate, endDate, status=ACTIVE)
        const activateResult = await activateStake(stake.stakeId);

        if (!activateResult.success) {
          results.push({
            stakeId: stake.stakeId,
            status: 'error',
            error: activateResult.error || 'Failed to activate stake',
          });
          continue;
        }

        // 6. Create referral commissions (L1-L5)
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

    // 7. Return processing results
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
