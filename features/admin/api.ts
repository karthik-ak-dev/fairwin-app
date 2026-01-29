import { apiClient, adminHeaders } from '@/lib/api/client';
import type { PayoutItem, PlatformStatsItem } from '@/lib/db/models';

interface AdminStatsResponse { stats: PlatformStatsItem }
interface AdminWinnersResponse { payouts: PayoutItem[]; nextCursor?: string }
interface WalletInfoResponse { address: string; maticBalance: string; usdcBalance: string; linkBalance: string }

export function getAdminStats(walletAddress: string) {
  return apiClient<AdminStatsResponse>('/api/admin/stats', {
    headers: adminHeaders(walletAddress),
  });
}

export function getAdminWinners(walletAddress: string, filter?: { status?: string; limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.limit) params.set('limit', String(filter.limit));
  if (filter?.cursor) params.set('cursor', filter.cursor);
  return apiClient<AdminWinnersResponse>(`/api/admin/winners?${params}`, {
    headers: adminHeaders(walletAddress),
  });
}

export function getWalletInfo(walletAddress: string) {
  return apiClient<WalletInfoResponse>('/api/admin/wallet', {
    headers: adminHeaders(walletAddress),
  });
}
