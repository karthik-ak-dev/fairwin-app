// POST /api/cron/process-withdrawals - Execute pending withdrawal transactions
// This is a CRON job endpoint protected by API key
// Responsibilities:
// - Validate API key
// - Get all PENDING withdrawals
// - For each withdrawal:
//   - Verify user has sufficient balance
//   - Execute BSC blockchain transfer
//   - Update withdrawal with txHash and move to PROCESSING
//   - Wait for blockchain confirmation
//   - Mark as COMPLETED or FAILED based on confirmation
// - Return processing results

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/apiKeyAuth';
import { getWithdrawalsByStatus } from '@/lib/db/repositories/withdrawal.repository';
import {
  initiateWithdrawalTransaction,
  completeWithdrawal,
  failWithdrawal,
} from '@/lib/services/withdrawal/withdrawal-entry.service';
import { calculateAvailableBalance } from '@/lib/services/withdrawal.service';
import {
  executeBscTransfer,
  waitForBscConfirmation,
} from '@/lib/services/blockchain/bsc.service';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
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

    // 2. Get all PENDING withdrawals
    const pendingWithdrawals = await getWithdrawalsByStatus(
      WithdrawalStatus.PENDING
    );

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

    // 3. Process each withdrawal
    const results = [];
    for (const withdrawal of pendingWithdrawals) {
      try {
        // 4. Verify user has sufficient balance
        const availableBalance = await calculateAvailableBalance(
          withdrawal.userId
        );

        if (withdrawal.amount > availableBalance) {
          // Insufficient balance - mark as FAILED
          await failWithdrawal(withdrawal.withdrawalId, 'Insufficient balance');
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'failed',
            reason: 'Insufficient balance',
          });
          continue;
        }

        // 5. Execute blockchain transaction
        let txHash: string;
        try {
          txHash = await executeBscTransfer(
            withdrawal.walletAddress,
            withdrawal.amount
          );
        } catch (error: any) {
          // Blockchain transaction failed
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

        // 6. Update withdrawal with txHash and move to PROCESSING
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

        // 7. Wait for blockchain confirmation
        const confirmed = await waitForBscConfirmation(
          txHash,
          constants.MIN_BLOCKCHAIN_CONFIRMATIONS,
          constants.BLOCKCHAIN_CONFIRMATION_TIMEOUT_MS
        );

        if (confirmed) {
          // 8. Mark as COMPLETED
          await completeWithdrawal(withdrawal.withdrawalId);
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'completed',
            txHash,
          });
        } else {
          // Blockchain confirmation timeout/failed
          await failWithdrawal(
            withdrawal.withdrawalId,
            'Blockchain confirmation timeout or failed'
          );
          results.push({
            withdrawalId: withdrawal.withdrawalId,
            status: 'failed',
            reason: 'Blockchain confirmation timeout',
            txHash, // Include txHash for manual investigation
          });
        }
      } catch (error: any) {
        // Unexpected error during processing
        try {
          await failWithdrawal(
            withdrawal.withdrawalId,
            `Processing error: ${error.message}`
          );
        } catch {
          // If failWithdrawal also fails, just log it
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

    // 9. Return processing results
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
