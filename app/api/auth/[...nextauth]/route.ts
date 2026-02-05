// NextAuth API route handler
// All authentication logic in one place

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env } from '@/lib/env';
import { constants } from '@/lib/constants';
import { handleUserSignIn } from '@/lib/services/auth/auth.service';
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
    async signIn({ user }) {
      if (!user.email) return false;

      const authProfile: AuthProfile = {
        email: user.email,
        name: user.name || 'Unknown User',
        picture: user.image || undefined,
      };

      const result = await handleUserSignIn(authProfile);
      return result !== null;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
