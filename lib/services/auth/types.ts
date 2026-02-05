// Authentication Service Types
// Used for Google SSO authentication flow

import { User, UserStatus } from '@/lib/db/models/User';

// OAuth profile data (Google, email/password, etc.)
export interface AuthProfile {
  email: string;
  name: string;
  picture?: string;
}

// Request to create new user from Google SSO
export interface CreateUserRequest {
  email: string;
  name: string;
  picture?: string;
  referralCode: string;
  referredBy?: string;
}

// Response after successful authentication
export interface AuthUserResponse {
  userId: string;
  email: string;
  name: string;
  picture?: string;
  referralCode: string;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt: Date;
}

// Response with user stats for dashboard
export interface UserStatsResponse {
  totalStaked: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalReferralEarnings: number;
  activeStakesCount: number;
  availableToWithdraw: number;
}

// Response with referral network stats
export interface UserReferralStatsResponse {
  directReferralsCount: number;
  totalNetworkSize: number;
  networkTotalStaked: number;
  totalReferralEarnings: number;
  earningsByLevel: {
    level: number;
    count: number;
    totalEarned: number;
  }[];
}

/**
 * Convert User to AuthUserResponse
 * Used to send safe user data to frontend
 */
export function toAuthUserResponse(user: User): AuthUserResponse {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    picture: user.picture,
    referralCode: user.referralCode,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
