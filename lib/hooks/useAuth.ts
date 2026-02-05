// React hook for Google SSO authentication
// Responsibilities:
// - useLogin(): Mutation for Google OAuth login
// - useLogout(): Clear auth state and session
// - Return isAuthenticated, user (email, name, picture), login, logout functions
// - Integrate with NextAuth session management
// - Store JWT token for API authentication

'use client';

import { useState } from 'react';

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

  const login = async () => {
    setIsLoading(true);
    // Simulate Google OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser(DUMMY_USER);
    setIsLoading(false);

    // In real implementation:
    // - Trigger NextAuth signIn('google')
    // - Redirect to Google OAuth consent screen
    // - Handle callback and store session
    // - Generate JWT token for API calls
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
