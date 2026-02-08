// NextAuth API route handler
// Route handlers only - configuration moved to lib/auth.ts for Next.js 15 compatibility

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
