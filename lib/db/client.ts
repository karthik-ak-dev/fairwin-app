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
  RAFFLES: process.env.DYNAMODB_TABLE_RAFFLES || 'fairwin-raffles',
  ENTRIES: process.env.DYNAMODB_TABLE_ENTRIES || 'fairwin-entries',
  USERS: process.env.DYNAMODB_TABLE_USERS || 'fairwin-users',
  WINNERS: process.env.DYNAMODB_TABLE_WINNERS || 'fairwin-winners',
  PAYOUTS: process.env.DYNAMODB_TABLE_PAYOUTS || 'fairwin-payouts',
} as const;
