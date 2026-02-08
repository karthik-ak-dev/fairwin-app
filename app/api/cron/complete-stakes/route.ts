// POST /api/cron/complete-stakes - Mark matured stakes as COMPLETED

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import { getStakesByStatusHelper, completeStake } from '@/lib/utils/stakes';
import { StakeStatus } from '@/lib/db/models/stake.model';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const activeStakes = await getStakesByStatusHelper(StakeStatus.ACTIVE);

    if (activeStakes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          totalActive: 0,
          matured: 0,
          message: 'No active stakes found',
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const maturedStakes = activeStakes.filter((stake) => {
      if (!stake.endDate) return false;
      const endDate = new Date(stake.endDate);
      return endDate <= now;
    });

    if (maturedStakes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          totalActive: activeStakes.length,
          matured: 0,
          message: 'No matured stakes found',
        },
        { status: 200 }
      );
    }

    const results = [];
    for (const stake of maturedStakes) {
      try {
        const result = await completeStake(stake.stakeId);

        if (result.success) {
          results.push({
            stakeId: stake.stakeId,
            status: 'completed',
            endDate: stake.endDate,
          });
        } else {
          results.push({
            stakeId: stake.stakeId,
            status: 'error',
            error: result.error || 'Failed to complete stake',
          });
        }
      } catch (error: any) {
        results.push({
          stakeId: stake.stakeId,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'completed').length;
    const failedCount = results.length - successCount;

    return NextResponse.json(
      {
        success: true,
        totalActive: activeStakes.length,
        matured: maturedStakes.length,
        completed: successCount,
        failed: failedCount,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in complete-stakes cron:', error);
    return NextResponse.json(
      { error: 'Failed to process stake completions' },
      { status: 500 }
    );
  }
}
