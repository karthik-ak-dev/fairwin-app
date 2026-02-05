// User Repository - Minimal CRUD operations for MVP
// Responsibilities:
// - Create user from Google SSO
// - Lookup users by email and referral code
// - Update last login timestamp

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { User, UserStatus } from '@/lib/db/models/User';
import { CreateUserRequest, AuthProfile } from '@/lib/services/auth/types';
import { generateReferralCode } from '@/lib/services/referral/referral-code.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const userId = uuidv4();
  const now = new Date();

  const user: User = {
    userId,
    email: data.email,
    name: data.name,
    picture: data.picture,
    referralCode: data.referralCode,
    referredBy: data.referredBy,
    status: UserStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  );

  return user;
}

/**
 * Get user by userId
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Key: { userId },
    })
  );

  return (result.Item as User) || null;
}

/**
 * Get user by email (unique identifier)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      IndexName: env.GSI_EMAIL,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] as User || null;
}

/**
 * Get user by referral code
 */
export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      IndexName: env.GSI_REFERRAL_CODE,
      KeyConditionExpression: 'referralCode = :referralCode',
      ExpressionAttributeValues: {
        ':referralCode': referralCode,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] as User || null;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET lastLoginAt = :now, updatedAt = :now',
      ExpressionAttributeValues: {
        ':now': new Date(),
      },
    })
  );
}


/**
 * Find or create user from OAuth authentication
 * Main method used during OAuth callback (Google, email/password, etc.)
 */
export async function findOrCreateUser(
  authProfile: AuthProfile,
  referralCode?: string
): Promise<User> {
  // Check if user exists
  let user = await getUserByEmail(authProfile.email);

  if (user) {
    // Existing user - just update last login
    await updateLastLogin(user.userId);
    return user;
  }

  // New user - find referrer if referral code provided
  let referrerId: string | undefined;
  if (referralCode) {
    const referrer = await getUserByReferralCode(referralCode);
    referrerId = referrer?.userId;
  }

  // Create new user
  user = await createUser({
    email: authProfile.email,
    name: authProfile.name,
    picture: authProfile.picture,
    referralCode: generateReferralCode(),
    referredBy: referrerId,
  });

  return user;
}
