'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface QuoteParams {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
}

export function useSocketQuote(params: QuoteParams | null) {
  return useQuery({
    queryKey: ['socket-quote', params],
    queryFn: () => apiClient<unknown>('/api/socket/quote', { method: 'POST', body: params }),
    enabled: !!params,
    staleTime: 30_000,
  });
}
