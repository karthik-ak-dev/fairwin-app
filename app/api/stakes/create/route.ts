// POST /api/stakes/create - Create new stake entry
// Responsibilities:
// - Authenticate user via JWT
// - Receive amount
// - Validate amount against stake config limits
// - Create stake with PENDING status (no txHash yet)
// - Return created stake object

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth.service';
import { createUserStake } from '@/lib/services/stake/stake-entry.service';

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
    const { amount } = body;

    // 3. Input validation
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount is required and must be a number' },
        { status: 400 }
      );
    }

    if (amount < 50 || amount > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between $50 and $10,000' },
        { status: 400 }
      );
    }

    // 4. Create stake with PENDING status (no txHash)
    // createUserStake validates amount against config and creates stake
    const result = await createUserStake(user.userId, amount);

    if (!result.success || !result.stake) {
      return NextResponse.json(
        { error: result.error || 'Failed to create stake' },
        { status: 400 }
      );
    }

    // 5. Return created stake
    return NextResponse.json(
      {
        success: true,
        stake: {
          id: result.stake.stakeId,
          amount: result.stake.amount,
          status: result.stake.status,
          userId: result.stake.userId,
          createdAt: result.stake.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating stake:', error);

    // Handle specific validation errors from service layer
    if (error.message?.includes('Invalid amount')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.message?.includes('Config not found')) {
      return NextResponse.json(
        { error: 'Stake configuration not found' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create stake' },
      { status: 500 }
    );
  }
}
