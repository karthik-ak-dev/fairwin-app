import { NextRequest } from 'next/server';
import { syncBlockchainEvents } from '@/lib/services/raffle/raffle-event-sync.service';
import { serverEnv } from '@/lib/env';

/**
 * POST /api/cron/sync-blockchain-events
 *
 * Syncs blockchain events to database.
 * Called by AWS EventBridge every 30 seconds.
 *
 * Security: Requires x-api-key header matching EVENTBRIDGE_API_KEY
 *
 * Returns:
 * {
 *   success: boolean,
 *   syncedBlocks: { from: number, to: number },
 *   eventsProcessed: { entries: number, draws: number, winners: number, cancellations: number },
 *   errors: Array<{ event: string, error: string }>,
 *   duration: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request from EventBridge
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = serverEnv.EVENTBRIDGE_API_KEY;

    if (!expectedKey) {
      console.error('[EventSync API] EVENTBRIDGE_API_KEY not configured');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (apiKey !== expectedKey) {
      console.warn('[EventSync API] Unauthorized request - invalid API key');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Run sync
    console.log('[EventSync API] Starting event sync...');
    const result = await syncBlockchainEvents();

    // 3. Return result
    const statusCode = result.success ? 200 : 207; // 207 = Multi-Status (partial success)

    return Response.json(result, { status: statusCode });
  } catch (error) {
    console.error('[EventSync API] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/sync-blockchain-events
 *
 * Health check endpoint
 */
export async function GET() {
  return Response.json({
    status: 'ready',
    message: 'Event sync endpoint is ready. Use POST to trigger sync.',
  });
}
