import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { serverEnv } from '@/lib/env';

const client = new DynamoDBClient({
  region: serverEnv.AWS_REGION,
  ...(serverEnv.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: serverEnv.AWS_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export const TABLE = {
  RAFFLES: serverEnv.DYNAMODB_TABLE_RAFFLES,
  ENTRIES: serverEnv.DYNAMODB_TABLE_ENTRIES,
  USERS: serverEnv.DYNAMODB_TABLE_USERS,
  WINNERS: serverEnv.DYNAMODB_TABLE_WINNERS,
  PLATFORM_STATS: serverEnv.DYNAMODB_TABLE_PLATFORM_STATS,
} as const;
