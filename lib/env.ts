// Environment configuration singleton
// All environment variables defined here with proper types and defaults

class Environment {
  private static instance: Environment;

  // AWS Configuration
  public readonly AWS_REGION: string;
  public readonly ENVIRONMENT: string = process.env.ENVIRONMENT || 'dev';

  // DynamoDB Tables
  public readonly DYNAMODB_USERS_TABLE: string;
  public readonly DYNAMODB_STAKES_TABLE: string;
  public readonly DYNAMODB_STAKE_CONFIGS_TABLE: string;
  public readonly DYNAMODB_REFERRALS_TABLE: string;
  public readonly DYNAMODB_REFERRAL_CONFIGS_TABLE: string;
  public readonly DYNAMODB_WITHDRAWALS_TABLE: string;

  // DynamoDB GSI Indexes - Users Table
  public readonly DYNAMODB_USERS_TABLE_GSI_EMAIL: string = 'email-index';
  public readonly DYNAMODB_USERS_TABLE_GSI_REFERRAL_CODE: string = 'referralCode-index';

  // NextAuth / Google OAuth
  public readonly NEXTAUTH_SECRET: string;
  public readonly NEXTAUTH_URL: string;
  public readonly GOOGLE_CLIENT_ID: string;
  public readonly GOOGLE_CLIENT_SECRET: string;

  // Application
  public readonly NODE_ENV: string;

  private constructor() {
    // AWS
    this.AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

    // DynamoDB Tables - following CloudFormation naming: MassiveHike-${Environment}-TableName
    const prefix = `MassiveHike-${this.ENVIRONMENT}`;
    this.DYNAMODB_USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || `${prefix}-Users`;
    this.DYNAMODB_STAKES_TABLE = process.env.DYNAMODB_STAKES_TABLE || `${prefix}-Stakes`;
    this.DYNAMODB_STAKE_CONFIGS_TABLE = process.env.DYNAMODB_STAKE_CONFIGS_TABLE || `${prefix}-StakeConfigs`;
    this.DYNAMODB_REFERRALS_TABLE = process.env.DYNAMODB_REFERRALS_TABLE || `${prefix}-Referrals`;
    this.DYNAMODB_REFERRAL_CONFIGS_TABLE = process.env.DYNAMODB_REFERRAL_CONFIGS_TABLE || `${prefix}-ReferralConfigs`;
    this.DYNAMODB_WITHDRAWALS_TABLE = process.env.DYNAMODB_WITHDRAWALS_TABLE || `${prefix}-Withdrawals`;

    // NextAuth
    this.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production';
    this.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

    // Application
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }
}

// Export singleton instance
export const env = Environment.getInstance();
