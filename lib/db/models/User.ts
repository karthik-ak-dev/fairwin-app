// User model (shared across platform)
// Responsibilities:
// - Define User interface with TypeScript types
// - Support Google SSO authentication
// - Track user profile and referral relationships
// - Stats are computed on-demand from Stakes and Referrals tables
// - This is a shared model used across the entire platform

// Enums
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export interface User {
  // Primary Key
  userId: string; // UUID or auto-generated ID

  // Authentication (Google SSO)
  email: string; // Unique email from Google (used as unique identifier)
  name: string; // Display name from Google
  picture?: string; // Profile picture URL from Google

  // Referral System
  referralCode: string; // Unique code for this user (e.g., "MH742d")
  referredBy?: string; // userId of the referrer (null for root users)

  // Account Status
  status: UserStatus; // Account status

  // Timestamps
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
  lastLoginAt: Date; // Last login timestamp
}


