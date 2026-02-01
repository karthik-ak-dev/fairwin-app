import { apiClient, adminHeaders } from '@/lib/api/client';
import type { RaffleItem, CreateRaffleInput } from '@/lib/db/models';
import type { EntryItem, WinnerItem } from '@/lib/db/models';

interface RafflesResponse { raffles: RaffleItem[]; nextCursor?: string }
interface RaffleDetailResponse { raffle: RaffleItem; recentEntries?: EntryItem[]; winners?: WinnerItem[] }
interface ParticipantsResponse { participants: EntryItem[]; nextCursor?: string }
interface WinnersResponse { winners: WinnerItem[] }
interface EntryResponse { entry: EntryItem }

export function getRaffles(filter?: { status?: string; type?: string; limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.type) params.set('type', filter.type);
  if (filter?.limit) params.set('limit', String(filter.limit));
  if (filter?.cursor) params.set('cursor', filter.cursor);
  return apiClient<RafflesResponse>(`/api/raffles?${params}`);
}

export function getRaffle(id: string) {
  return apiClient<RaffleDetailResponse>(`/api/raffles/${id}`);
}

export function enterRaffle(id: string, data: { walletAddress: string; numEntries: number; totalPaid: number; transactionHash: string; blockNumber: number }) {
  return apiClient<EntryResponse>(`/api/raffles/${id}/enter`, { method: 'POST', body: data });
}

export function getParticipants(id: string, limit?: number, cursor?: string) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return apiClient<ParticipantsResponse>(`/api/raffles/${id}/participants?${params}`);
}

export function getWinners(id: string) {
  return apiClient<WinnersResponse>(`/api/raffles/${id}/winners`);
}

export function createRaffle(data: CreateRaffleInput, walletAddress: string) {
  return apiClient<{ raffle: RaffleItem }>('/api/raffles', {
    method: 'POST', body: data, headers: adminHeaders(walletAddress),
  });
}

export function updateRaffle(id: string, data: Partial<RaffleItem>, walletAddress: string) {
  return apiClient<{ raffle: RaffleItem }>(`/api/raffles/${id}`, {
    method: 'PATCH', body: data, headers: adminHeaders(walletAddress),
  });
}

export function triggerDraw(id: string, walletAddress: string) {
  return apiClient<{ success: boolean }>(`/api/raffles/${id}/draw`, {
    method: 'POST', headers: adminHeaders(walletAddress),
  });
}
