'use client';

import { cn } from '@/shared/utils/cn';
import AddressDisplay from './AddressDisplay';

interface WalletStatusProps {
  address: string;
  balance?: string;
  onClick?: () => void;
}

export default function WalletStatus({ address, balance, onClick }: WalletStatusProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 transition-colors',
        onClick && 'hover:border-[#00ff88]/30 hover:bg-zinc-800 cursor-pointer'
      )}
    >
      {/* Green status dot */}
      <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />

      {/* Address */}
      <AddressDisplay address={address} className="text-xs" />

      {/* Optional balance */}
      {balance && (
        <>
          <span className="w-px h-4 bg-zinc-700" />
          <span className="text-xs text-[#888888] font-mono">{balance}</span>
        </>
      )}
    </button>
  );
}
