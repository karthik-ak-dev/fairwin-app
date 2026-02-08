// Application constants singleton
// All application-wide constants defined here with proper types

class Constants {
  private static instance: Constants;

  // Authentication & Session
  public readonly SESSION_MAX_AGE_SECONDS: number = 30 * 24 * 60 * 60; // 30 days

  // Default Staking Configuration
  // Points to which StakeConfig to use for new stakes
  public readonly DEFAULT_STAKE_CONFIG_ID: string = '8_PERCENT_24_MONTHS';

  // Default Referral Configuration
  // Points to which ReferralConfig to use
  public readonly DEFAULT_REFERRAL_CONFIG_ID: string = '5_LEVEL_STANDARD';

  // Withdrawal Settings
  public readonly WITHDRAWAL_DAY_OF_MONTH: number = 1; // Withdrawals only allowed on 1st of each month
  public readonly MAX_WITHDRAWAL_AMOUNT: number = 1000; // Maximum withdrawal amount in USDT
  public readonly MIN_WITHDRAWAL_AMOUNT: number = 10; // Minimum withdrawal amount in USDT

  // Referral Code Settings
  public readonly REFERRAL_CODE_PREFIX: string = 'MH'; // Prefix for all referral codes
  public readonly REFERRAL_CODE_LENGTH: number = 6; // Total length including prefix (MH + 4 chars)

  // Blockchain Settings
  public readonly MIN_BLOCKCHAIN_CONFIRMATIONS: number = 3; // Minimum confirmations for transaction verification
  public readonly BLOCKCHAIN_CONFIRMATION_TIMEOUT_MS: number = 5 * 60 * 1000; // 5 minutes
  public readonly BSC_POLLING_INTERVAL_MS: number = 3000; // 3 seconds between transaction status checks
  public readonly AMOUNT_VERIFICATION_TOLERANCE: number = 0.01; // Tolerance for amount matching (USDT)

  // Time Calculations
  public readonly MILLISECONDS_PER_MONTH: number = 1000 * 60 * 60 * 24 * 30; // Approximate (will be replaced with date-fns)

  // Stake Cleanup Settings
  public readonly ABANDONED_STAKE_TIMEOUT_HOURS: number = 24; // Delete PENDING stakes older than 24 hours

  // Support Contact
  public readonly SUPPORT_EMAIL: string = 'support@massivehike.com';

  private constructor() {
    // All constants are initialized above as readonly properties
  }

  public static getInstance(): Constants {
    if (!Constants.instance) {
      Constants.instance = new Constants();
    }
    return Constants.instance;
  }
}

// Export singleton instance
export const constants = Constants.getInstance();
