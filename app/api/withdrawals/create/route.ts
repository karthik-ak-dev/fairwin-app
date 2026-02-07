// POST /api/withdrawals/create - Request withdrawal
// Responsibilities:
// - Authenticate user via JWT
// - Receive amount and walletAddress
// - Validate withdrawal date (only 1st of month)
// - Verify user hasn't withdrawn this month
// - Validate amount against min/max limits
// - Verify sufficient available balance
// - Create withdrawal with PENDING status
// - Return withdrawal record

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth.service';
import {
  createUserWithdrawal,
  isWithdrawalDayAllowed,
  hasWithdrawnThisMonth,
} from '@/lib/services/withdrawal/withdrawal-entry.service';
import { calculateAvailableBalance } from '@/lib/services/withdrawal.service';
import { constants } from '@/lib/constants';

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
    const { amount, walletAddress } = body;

    // 3. Input validation
    if (!amount || !walletAddress) {
      return NextResponse.json(
        { error: 'amount and walletAddress are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Invalid amount or walletAddress format' },
        { status: 400 }
      );
    }

    // Validate BSC wallet address format (0x + 40 hex characters)
    const bscAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!bscAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid BSC wallet address format. Must be 0x followed by 40 hexadecimal characters.' },
        { status: 400 }
      );
    }

    // 4. Validate amount range
    if (
      amount < constants.MIN_WITHDRAWAL_AMOUNT ||
      amount > constants.MAX_WITHDRAWAL_AMOUNT
    ) {
      return NextResponse.json(
        {
          error: `Amount must be between $${constants.MIN_WITHDRAWAL_AMOUNT} and $${constants.MAX_WITHDRAWAL_AMOUNT}`,
        },
        { status: 400 }
      );
    }

    // 5. Check if today is withdrawal day (1st of month)
    if (!isWithdrawalDayAllowed()) {
      return NextResponse.json(
        { error: 'Withdrawals are only allowed on the 1st of each month' },
        { status: 403 }
      );
    }

    // 6. Check if user already withdrew this month
    const alreadyWithdrawn = await hasWithdrawnThisMonth(user.userId);
    if (alreadyWithdrawn) {
      return NextResponse.json(
        { error: 'You have already withdrawn this month' },
        { status: 403 }
      );
    }

    // 7. Calculate available balance
    const availableBalance = await calculateAvailableBalance(user.userId);
    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // 8. Create withdrawal with PENDING status
    const result = await createUserWithdrawal(user.userId, walletAddress, amount);

    if (!result.success || !result.withdrawal) {
      return NextResponse.json(
        { error: result.error || 'Failed to create withdrawal' },
        { status: 400 }
      );
    }

    // 9. Return withdrawal object
    return NextResponse.json(
      {
        success: true,
        withdrawal: {
          id: result.withdrawal.withdrawalId,
          amount: result.withdrawal.amount,
          walletAddress: result.withdrawal.walletAddress,
          status: result.withdrawal.status,
          userId: result.withdrawal.userId,
          createdAt: result.withdrawal.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating withdrawal:', error);

    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}
