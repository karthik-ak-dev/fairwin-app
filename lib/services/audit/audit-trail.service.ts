/**
 * Audit Trail Service
 *
 * Records all critical actions for transparency and compliance.
 * Stores immutable records of:
 * - Raffle creation
 * - Winner selection (with random seed)
 * - Payouts
 * - Administrative actions
 *
 * Use cases:
 * - Public verification of fairness
 * - Dispute resolution
 * - Regulatory compliance
 * - Security audits
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { serverEnv } from '@/lib/env';

const client = new DynamoDBClient({ region: serverEnv.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Table name for audit logs
const AUDIT_TABLE = process.env.DYNAMODB_TABLE_AUDIT_LOG || 'FairWin-Stage-AuditLog';

export interface AuditLogEntry {
  auditId: string; // UUID
  timestamp: number; // Unix timestamp (ms)
  action: string; // Action type
  actor: string; // Wallet address or 'SYSTEM'
  raffleId?: string; // Related raffle ID
  metadata: Record<string, any>; // Action-specific data
  ipAddress?: string; // IP address of actor
  userAgent?: string; // User agent string
}

/**
 * Create audit log entry
 */
async function createAuditLog(entry: Omit<AuditLogEntry, 'auditId' | 'timestamp'>): Promise<void> {
  const auditEntry: AuditLogEntry = {
    auditId: crypto.randomUUID(),
    timestamp: Date.now(),
    ...entry,
  };

  await docClient.send(
    new PutCommand({
      TableName: AUDIT_TABLE,
      Item: auditEntry,
    })
  );
}

/**
 * Record raffle creation
 */
export async function auditRaffleCreation(params: {
  raffleId: string;
  adminWallet: string;
  raffleDetails: {
    title: string;
    entryPrice: number;
    startTime: string;
    endTime: string;
  };
  ipAddress?: string;
}): Promise<void> {
  await createAuditLog({
    action: 'RAFFLE_CREATED',
    actor: params.adminWallet,
    raffleId: params.raffleId,
    metadata: {
      ...params.raffleDetails,
    },
    ipAddress: params.ipAddress,
  });
}

/**
 * Record winner selection
 */
export async function auditWinnerSelection(params: {
  raffleId: string;
  adminWallet: string;
  randomSeed: string;
  blockNumber?: bigint;
  blockHash?: string;
  winners: Array<{
    walletAddress: string;
    ticketNumber: number;
    prize: number;
    tier: string;
  }>;
  totalTickets: number;
  totalPrize: number;
}): Promise<void> {
  await createAuditLog({
    action: 'WINNERS_SELECTED',
    actor: params.adminWallet,
    raffleId: params.raffleId,
    metadata: {
      randomSeed: params.randomSeed,
      blockNumber: params.blockNumber?.toString(),
      blockHash: params.blockHash,
      winners: params.winners,
      totalTickets: params.totalTickets,
      totalPrize: params.totalPrize,
      selectionMethod: params.blockHash ? 'BLOCK_HASH' : 'CRYPTO_RANDOM',
    },
  });
}

/**
 * Record payout transaction
 */
export async function auditPayout(params: {
  raffleId: string;
  winnerId: string;
  walletAddress: string;
  amount: number;
  transactionHash: string;
  adminWallet: string;
}): Promise<void> {
  await createAuditLog({
    action: 'PAYOUT_SENT',
    actor: params.adminWallet,
    raffleId: params.raffleId,
    metadata: {
      winnerId: params.winnerId,
      recipientWallet: params.walletAddress,
      amount: params.amount,
      amountUSDC: (params.amount / 1_000_000).toFixed(2),
      transactionHash: params.transactionHash,
    },
  });
}

/**
 * Record raffle cancellation
 */
export async function auditRaffleCancellation(params: {
  raffleId: string;
  adminWallet: string;
  reason: string;
  totalRefunded?: number;
}): Promise<void> {
  await createAuditLog({
    action: 'RAFFLE_CANCELLED',
    actor: params.adminWallet,
    raffleId: params.raffleId,
    metadata: {
      reason: params.reason,
      totalRefunded: params.totalRefunded,
    },
  });
}

/**
 * Record entry creation (for high-value tracking)
 */
export async function auditEntry(params: {
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  transactionHash: string;
}): Promise<void> {
  // Only audit entries above threshold (e.g., 100 USDC)
  if (params.totalPaid >= 100_000_000) {
    await createAuditLog({
      action: 'HIGH_VALUE_ENTRY',
      actor: params.walletAddress,
      raffleId: params.raffleId,
      metadata: {
        numEntries: params.numEntries,
        totalPaid: params.totalPaid,
        totalPaidUSDC: (params.totalPaid / 1_000_000).toFixed(2),
        transactionHash: params.transactionHash,
      },
    });
  }
}

/**
 * Record admin action
 */
export async function auditAdminAction(params: {
  action: string;
  adminWallet: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  await createAuditLog({
    action: `ADMIN_${params.action}`,
    actor: params.adminWallet,
    metadata: {
      description: params.description,
      ...params.metadata,
    },
    ipAddress: params.ipAddress,
  });
}

/**
 * Get audit logs for a raffle
 */
export async function getRaffleAuditLog(raffleId: string): Promise<AuditLogEntry[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: AUDIT_TABLE,
      IndexName: 'raffleId-timestamp-index',
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: {
        ':raffleId': raffleId,
      },
      ScanIndexForward: false, // Newest first
    })
  );

  return (result.Items || []) as AuditLogEntry[];
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(
  action: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: AUDIT_TABLE,
      IndexName: 'action-timestamp-index',
      KeyConditionExpression: 'action = :action',
      ExpressionAttributeValues: {
        ':action': action,
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (result.Items || []) as AuditLogEntry[];
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: AUDIT_TABLE,
      IndexName: 'timestamp-index',
      KeyConditionExpression: '#ts > :minTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':minTimestamp': Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (result.Items || []) as AuditLogEntry[];
}
