import { env } from '@/lib/env';

const API_BASE = typeof window !== 'undefined' ? '' : env.APP_URL;

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const url = endpoint.startsWith('/api') ? `${API_BASE}${endpoint}` : `${API_BASE}/api${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return res.json();
}

// Primary export: direct function call for new code
export { fetchApi as apiCall };

// Backward-compatible object with method helpers + callable via fetchApi
export const apiClient = Object.assign(
  <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => fetchApi<T>(endpoint, options),
  {
    get: <T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>) => {
      let url = endpoint;
      if (params) {
        const qs = new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
        ).toString();
        if (qs) url += `?${qs}`;
      }
      return fetchApi<T>(url, { headers });
    },
    post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
      fetchApi<T>(endpoint, { method: 'POST', body, headers }),
    patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
      fetchApi<T>(endpoint, { method: 'PATCH', body, headers }),
    delete: <T>(endpoint: string, headers?: Record<string, string>) =>
      fetchApi<T>(endpoint, { method: 'DELETE', headers }),
  },
);

export function adminHeaders(walletAddress: string): Record<string, string> {
  return { 'x-wallet-address': walletAddress };
}
