// React hook for Google SSO authentication
// Responsibilities:
// - useLogin(): Mutation for Google OAuth login
// - useLogout(): Clear auth state and session
// - Return isAuthenticated, user (email, name, picture), login, logout functions
// - Integrate with NextAuth session management

'use client';

import { useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

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

  // Check for pending referral code after successful login
  useEffect(() => {
    if (session?.user && typeof window !== 'undefined') {
      const pendingRef = localStorage.getItem('pendingReferralCode');
      if (pendingRef) {
        // TODO: POST /api/users/referral with referralCode
        // Backend associates referral with user account
        console.log('Processing referral code:', pendingRef);

        // Clear the stored referral code
        localStorage.removeItem('pendingReferralCode');
      }
    }
  }, [session]);

  const login = async () => {
    await signIn('google', {
      callbackUrl: '/dashboard',
      // Force Google account selection screen every time
      prompt: 'select_account'
    });
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading,
    login,
    logout,
  };
}
