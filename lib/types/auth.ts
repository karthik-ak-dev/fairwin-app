// Authentication Types
// Shared types for authentication flow

export interface AuthProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  picture?: string;
  referralCode: string;
  referredBy?: string;
}
