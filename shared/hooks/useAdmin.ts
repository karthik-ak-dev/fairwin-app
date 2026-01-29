'use client';

import { useAccount } from 'wagmi';

export function useAdmin() {
  const { address, isConnected } = useAccount();
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;

  const isAdmin = isConnected && !!address && !!adminAddress &&
    address.toLowerCase() === adminAddress.toLowerCase();

  return { isAdmin, address, isConnected };
}
