// React hook for Google SSO authentication
// Responsibilities:
// - useLogin(): Mutation for Google OAuth login
// - useLogout(): Clear auth state and session
// - Return isAuthenticated, user (email, name, picture), login, logout functions
// - Integrate with NextAuth session management
// - Store JWT token for API authentication

'use client';

import { useState, useEffect } from 'react';

// Dummy Google user data
const DUMMY_USER = {
  id: 'user_123456',
  email: 'john.doe@gmail.com',
  name: 'John Doe',
  picture: 'https://ui-avatars.com/api/?name=John+Doe&background=0099ff&color=fff&size=128',
  emailVerified: true,
};

export function useAuth() {
  // For mockup purposes, auto-login with dummy user
  const [user, setUser] = useState<typeof DUMMY_USER | null>(DUMMY_USER);
  const [isLoading, setIsLoading] = useState(false);

  // Check for referral code in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');

      if (refCode) {
        // Store referral code in localStorage for use after login
        localStorage.setItem('pendingReferralCode', refCode);
        console.log('Referral code stored:', refCode);
      }
    }
  }, []);

  const login = async () => {
    setIsLoading(true);
    // Simulate Google OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser(DUMMY_USER);
    setIsLoading(false);

    // Check for pending referral code after login
    const pendingRef = localStorage.getItem('pendingReferralCode');
    if (pendingRef) {
      // In real implementation:
      // - POST /api/users/referral with referralCode
      // - Backend associates referral with user account
      // - Backend validates referral code exists
      // - Backend creates referral relationship
      console.log('Processing referral code:', pendingRef);

      // Clear the stored referral code
      localStorage.removeItem('pendingReferralCode');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(`Successfully joined via referral code: ${pendingRef}`);
    }

    // In real implementation:
    // - Trigger NextAuth signIn('google')
    // - Redirect to Google OAuth consent screen
    // - Handle callback and store session
    // - Generate JWT token for API calls
    // - Process referral code if exists
  };

  const logout = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setIsLoading(false);

    // In real implementation:
    // - Call NextAuth signOut()
    // - Clear localStorage token
    // - Redirect to landing page
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}
