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
  public readonly WITHDRAWAL_DAY_OF_MONTH: number = 1;

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
