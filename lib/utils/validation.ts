// Validation utility functions
// Used for validating user inputs across the application

export const isValidBSCWallet = (address: string): boolean => {
  // BSC wallet addresses start with 0x and are 42 characters long
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidReferralCode = (code: string): boolean => {
  // Referral codes are in format: MH + 4 alphanumeric characters
  return /^MH[0-9a-z]{4}$/i.test(code);
};
