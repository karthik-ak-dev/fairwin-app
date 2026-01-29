const SOCKET_BASE = 'https://api.socket.tech/v2';
const API_KEY = process.env.SOCKET_API_KEY || '';

async function socketFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SOCKET_BASE}${endpoint}`, {
    ...options,
    headers: {
      'API-KEY': API_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Socket API error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

export async function getQuote(params: {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
}) {
  const qs = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
      {} as Record<string, string>,
    ),
  );
  return socketFetch<unknown>(`/quote?${qs}`);
}

export async function getBridgeStatus(transactionHash: string, fromChainId: number, toChainId: number) {
  const qs = new URLSearchParams({
    transactionHash,
    fromChainId: String(fromChainId),
    toChainId: String(toChainId),
  });
  return socketFetch<unknown>(`/bridge-status?${qs}`);
}
