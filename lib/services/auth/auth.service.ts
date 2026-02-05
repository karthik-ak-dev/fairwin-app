// Auth Service Layer
// Business logic for authentication operations

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserByEmail } from '@/lib/db/repositories/user.repository';
import { User } from '@/lib/db/models/User';

/**
 * Get current authenticated user from database
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await getUserByEmail(session.user.email);
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}
