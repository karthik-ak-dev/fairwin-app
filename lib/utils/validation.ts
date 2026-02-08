// Validation utility functions
// Used for validating user inputs across the application

import { constants } from '@/lib/constants';

export const isValidBSCWallet = (address: string): boolean => {
  // BSC wallet addresses start with 0x and are 42 characters long
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidReferralCode = (code: string): boolean => {
  // Referral codes use configured prefix and length
  const randomLength = constants.REFERRAL_CODE_LENGTH - constants.REFERRAL_CODE_PREFIX.length;
  const pattern = new RegExp(`^${constants.REFERRAL_CODE_PREFIX}[0-9a-zA-Z]{${randomLength}}$`);
  return pattern.test(code);
};
