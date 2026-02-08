// POST /api/cron/complete-stakes - Mark matured stakes as COMPLETED
// This is a CRON job endpoint protected by API key
// Responsibilities:
// - Validate API key
// - Get all ACTIVE stakes
// - Filter stakes that have reached endDate
// - Mark matured stakes as COMPLETED
// - Return processing results

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import { getActiveStakes, completeStake } from '@/lib/services/stake/stake-entry.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for cron job

export async function POST(request: NextRequest) {
  try {
    // 1. API Key Authentication
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // 2. Get all ACTIVE stakes
    const activeStakes = await getActiveStakes();

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

    // 3. Filter stakes that have reached endDate
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

    // 4. Complete each matured stake
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

    // 5. Return processing results
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
