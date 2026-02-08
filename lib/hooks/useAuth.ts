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

  // Check for referral code in URL on mount and store it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');

      if (refCode) {
        // Store referral code in both localStorage and cookie
        // Cookie will be accessible on the server during OAuth callback
        localStorage.setItem('pendingReferralCode', refCode);
        document.cookie = `pendingReferralCode=${refCode}; path=/; max-age=3600; SameSite=Lax`;
      }
    }
  }, []);

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
