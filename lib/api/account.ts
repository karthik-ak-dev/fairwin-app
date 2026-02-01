import { apiClient } from '@/lib/api/client';
import type { UserItem, WinnerItem } from '@/lib/db/models';
import type { UserEntry } from './types';

interface UserProfileResponse { user: UserItem }
interface UserEntriesResponse { entries: UserEntry[]; nextCursor?: string }
interface UserWinsResponse { wins: WinnerItem[]; nextCursor?: string }

export function getUserProfile(address: string) {
  return apiClient<UserProfileResponse>(`/api/user?address=${encodeURIComponent(address)}`);
}

export function getUserEntries(address: string, limit?: number, cursor?: string) {
  const params = new URLSearchParams({ address });
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return apiClient<UserEntriesResponse>(`/api/user/entries?${params}`);
}

export function getUserWins(address: string, limit?: number, cursor?: string) {
  const params = new URLSearchParams({ address });
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return apiClient<UserWinsResponse>(`/api/user/wins?${params}`);
}
