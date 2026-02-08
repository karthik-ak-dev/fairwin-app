// Authentication Service Types
// Used for Google SSO authentication flow

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
