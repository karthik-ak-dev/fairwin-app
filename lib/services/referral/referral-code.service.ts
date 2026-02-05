// Referral utility functions

/**
 * Generate a unique 6-character referral code
 * Format: MH + 6 random alphanumeric characters (uppercase)
 * Example: MHa7k9p2
 */
export const generateReferralCode = (): string => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomPart = Array.from({ length: 6 }, () =>
    characters[Math.floor(Math.random() * characters.length)]
  ).join('');
  return `MH${randomPart}`;
};
