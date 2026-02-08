// NextAuth configuration
// Separated from route.ts to avoid Next.js 15 export restrictions

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { constants } from '@/lib/constants';
import { findOrCreateUser } from '@/lib/db/repositories/user.repository';
import { AuthProfile } from '@/lib/services/auth/types';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'select_account', // Force account selection every time
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const authProfile: AuthProfile = {
        email: user.email,
        name: user.name || 'Unknown User',
        picture: user.image || undefined,
      };

      // Get referral code from cookie (set by the client before OAuth)
      let referralCode: string | undefined;
      try {
        const cookieStore = await cookies();
        referralCode = cookieStore.get('pendingReferralCode')?.value;
      } catch (error) {
        // Cookies API might not be available in all contexts
        referralCode = undefined;
      }

      try {
        const result = await findOrCreateUser(authProfile, referralCode);
        return result !== null;
      } catch (error) {
        console.error('Error handling user sign-in:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: constants.SESSION_MAX_AGE_SECONDS,
  },
  secret: env.NEXTAUTH_SECRET,
};
