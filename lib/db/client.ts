import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }),
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export const TABLE = {
  RAFFLES: process.env.DYNAMODB_TABLE_RAFFLES || 'FairWin-Stage-Raffle-Raffles',
  ENTRIES: process.env.DYNAMODB_TABLE_ENTRIES || 'FairWin-Stage-Raffle-Entries',
  USERS: process.env.DYNAMODB_TABLE_USERS || 'FairWin-Stage-Users',
  WINNERS: process.env.DYNAMODB_TABLE_WINNERS || 'FairWin-Stage-Raffle-Winners',
  PAYOUTS: process.env.DYNAMODB_TABLE_PAYOUTS || 'FairWin-Stage-Raffle-Payouts',
  PLATFORM_STATS: process.env.DYNAMODB_TABLE_PLATFORM_STATS || 'FairWin-Stage-PlatformStats',
} as const;
