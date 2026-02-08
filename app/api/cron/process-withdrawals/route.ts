// POST /api/cron/process-withdrawals - Execute pending withdrawal transactions

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import {
  getWithdrawalsByStatusHelper,
  initiateWithdrawalTransaction,
  completeWithdrawal,
  failWithdrawal,
  calculateAvailableBalance,
} from '@/lib/utils/withdrawals';
import { executeBscTransfer, waitForBscConfirmation } from '@/lib/utils/blockchain';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { constants } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const pendingWithdrawals = await getWithdrawalsByStatusHelper(WithdrawalStatus.PENDING);

    if (pendingWithdrawals.length === 0) {
      return NextResponse.json(
        {
          success: true,
          processed: 0,
          message: 'No pending withdrawals',
        },
        { status: 200 }
      );
    }

    const results = [];
    for (const withdrawal of pendingWithdrawals) {
      try {
        const availableBalance = await calculateAvailableBalance(withdrawal.userId);

        if (withdrawal.amount > availableBalance) {
          await failWithdrawal(withdrawal.withdrawalId, 'Insufficient balance');
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'failed',
            reason: 'Insufficient balance',
          });
          continue;
        }

        let txHash: string;
        try {
          txHash = await executeBscTransfer(withdrawal.walletAddress, withdrawal.amount);
        } catch (error: any) {
          await failWithdrawal(
            withdrawal.withdrawalId,
            `Blockchain transaction failed: ${error.message}`
          );
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'failed',
            reason: `Blockchain error: ${error.message}`,
          });
          continue;
        }

        const initiateResult = await initiateWithdrawalTransaction(
          withdrawal.withdrawalId,
          txHash
        );

        if (!initiateResult.success) {
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'error',
            error: initiateResult.error || 'Failed to initiate transaction',
          });
          continue;
        }

        const confirmed = await waitForBscConfirmation(
          txHash,
          constants.MIN_BLOCKCHAIN_CONFIRMATIONS,
          constants.BLOCKCHAIN_CONFIRMATION_TIMEOUT_MS
        );

        if (confirmed) {
          await completeWithdrawal(withdrawal.withdrawalId);
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'completed',
            txHash,
          });
        } else {
          await failWithdrawal(
            withdrawal.withdrawalId,
            'Blockchain confirmation timeout or failed'
          );
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'failed',
            reason: 'Blockchain confirmation timeout',
            txHash,
          });
        }
      } catch (error: any) {
        try {
          await failWithdrawal(
            withdrawal.withdrawalId,
            `Processing error: ${error.message}`
          );
        } catch {
          console.error(
            `Failed to mark withdrawal ${withdrawal.withdrawalId} as failed`
          );
        }

        results.push({
          withdrawalId: withdrawal.withdrawalId,
          status: 'error',
          error: error.message,
        });
      }
    }

    const completedCount = results.filter((r) => r.status === 'completed').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json(
      {
        success: true,
        processed: pendingWithdrawals.length,
        completed: completedCount,
        failed: failedCount,
        errors: errorCount,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in process-withdrawals cron:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawals' },
      { status: 500 }
    );
  }
}
