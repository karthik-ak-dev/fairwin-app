'use client';

// ============================================================================
// Operator Wallet — Hero Card (real data)
// ============================================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWalletInfo } from '@/lib/api/admin';
import { formatUSDC, formatNumber, formatAddress } from '@/shared/utils/format';
import { getAddressUrl } from '@/shared/utils/constants';
import { Skeleton } from '@/shared/components/ui';

interface WalletHeroProps {
  address: string;
}

export default function WalletHero({ address }: WalletHeroProps) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallet', address],
    queryFn: () => getWalletInfo(address),
    enabled: !!address,
    staleTime: 15_000,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-[#00ff88]/10 bg-gradient-to-br from-[#0a1a10] to-[#0a0a0a] p-6">
      {/* Address row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
            Operator Address
          </p>
          <p className="mt-1 font-mono text-[14px] text-white break-all">
            {address}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.04]"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <a
            href={getAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/10"
          >
            View on Polygonscan ↗
          </a>
        </div>
      </div>

      {/* Balance columns */}
      <div className="mt-6 grid grid-cols-3 gap-6 border-t border-white/[0.06] pt-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="w-16 h-3 mb-2" />
              <Skeleton className="w-24 h-8 mb-1" />
              <Skeleton className="w-20 h-3" />
            </div>
          ))
        ) : (
          <>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">MATIC</p>
              <p className="mt-1 text-[24px] font-bold text-white">
                {formatNumber(data?.maticBalance ?? 0)}
              </p>
              <p className="mt-0.5 text-[12px] text-[#555]">Gas token</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">USDC Revenue</p>
              <p className="mt-1 text-[24px] font-bold text-[#00ff88]">
                {formatUSDC(data?.usdcBalance ?? 0)}
              </p>
              <p className="mt-0.5 text-[12px] text-[#555]">Protocol fees collected</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">LINK VRF</p>
              <p className="mt-1 text-[24px] font-bold text-white">
                {formatNumber(data?.linkBalance ?? 0)}
              </p>
              <p className="mt-0.5 text-[12px] text-[#555]">Chainlink VRF balance</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
