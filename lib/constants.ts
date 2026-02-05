// Application constants singleton
// All application-wide constants defined here with proper types

class Constants {
  private static instance: Constants;

  // Authentication & Session
  public readonly SESSION_MAX_AGE_SECONDS: number = 30 * 24 * 60 * 60; // 30 days

  // Staking Parameters
  public readonly MIN_STAKE: number = 50; // $50
  public readonly MAX_STAKE: number = 10000; // $10,000
  public readonly MONTHLY_RETURN_RATE: number = 0.08; // 8%
  public readonly STAKE_DURATION_MONTHS: number = 24;

  // Referral System
  public readonly REFERRAL_COMMISSION_RATES: number[] = [0.08, 0.03, 0.02, 0.01, 0.01]; // 5 levels
  public readonly MAX_REFERRAL_LEVELS: number = 5;

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
