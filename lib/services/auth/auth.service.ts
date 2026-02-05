// Auth Service Layer
// Business logic for authentication operations

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserByEmail, findOrCreateUser } from '@/lib/db/repositories/user.repository';
import { User } from '@/lib/db/models/user.model';
import { AuthProfile } from './types';

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

/**
 * Handle user sign-in by finding or creating user
 * Returns the user if successful, null if failed
 */
export async function handleUserSignIn(authProfile: AuthProfile): Promise<User | null> {
  try {
    const user = await findOrCreateUser(authProfile);
    return user;
  } catch (error) {
    console.error('Error handling user sign-in:', error);
    return null;
  }
}
