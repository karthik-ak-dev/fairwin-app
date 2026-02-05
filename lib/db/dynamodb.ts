// DynamoDB client initialization
// Singleton pattern - reuse client across all repositories

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client once
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Create DocumentClient with default configuration
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false, // Don't convert empty strings
  },
});
