// Auth Utilities
// Authentication helpers

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db/repositories/user.repository';
import { User } from '@/lib/db/models/user.model';

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
