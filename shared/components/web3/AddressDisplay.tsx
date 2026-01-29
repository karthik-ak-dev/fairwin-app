'use client';

import { useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { formatAddress } from '@/shared/utils/format';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export default function AddressDisplay({ address, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const el = document.createElement('textarea');
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'relative inline-flex items-center font-mono text-sm text-white hover:text-[#00ff88] transition-colors cursor-pointer',
        className
      )}
      title="Click to copy address"
    >
      {formatAddress(address)}

      {/* Copied tooltip */}
      <span
        className={cn(
          'absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-sans font-medium text-black bg-[#00ff88] rounded transition-all duration-200 pointer-events-none whitespace-nowrap',
          copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        )}
      >
        Copied!
      </span>
    </button>
  );
}
