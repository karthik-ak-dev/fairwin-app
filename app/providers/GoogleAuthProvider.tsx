// Google SSO Authentication Provider using NextAuth
// Responsibilities:
// - Configure NextAuth with Google OAuth provider
// - Handle Google sign-in flow
// - Manage session state
// - Provide auth context to entire app
// - Store user email, name, and profile picture from Google
// - Generate JWT token for API authentication

'use client';

import { SessionProvider } from 'next-auth/react';

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
