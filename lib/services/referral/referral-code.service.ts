// Referral utility functions

import { constants } from '@/lib/constants';

/**
 * Generate a unique referral code
 * Format: PREFIX + random alphanumeric characters
 * Example: MHa7k9p2
 */
export const generateReferralCode = (): string => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLength = constants.REFERRAL_CODE_LENGTH - constants.REFERRAL_CODE_PREFIX.length;
  const randomPart = Array.from({ length: randomLength }, () =>
    characters[Math.floor(Math.random() * characters.length)]
  ).join('');
  return `${constants.REFERRAL_CODE_PREFIX}${randomPart}`;
};
