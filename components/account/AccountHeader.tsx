'use client';

import { useState } from 'react';
import { Card, CardContent, Button } from '@/shared/components/ui';
import { formatAddress } from '@/shared/utils/format';
import { getAddressUrl } from '@/shared/utils/constants';

interface AccountHeaderProps {
  address: string;
  onDisconnect?: () => void;
}

/** Generate a deterministic gradient from an address for use as an avatar */
function addressToGradient(address: string): string {
  const hash = address.toLowerCase().replace('0x', '');
  const h1 = parseInt(hash.slice(0, 4), 16) % 360;
  const h2 = (h1 + 120 + (parseInt(hash.slice(4, 6), 16) % 120)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 80%, 55%), hsl(${h2}, 70%, 50%))`;
}

export default function AccountHeader({ address, onDisconnect }: AccountHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="relative overflow-hidden border-[#00ff88]/20 bg-gradient-to-r from-[rgba(0,255,136,0.05)] to-transparent">
      {/* Green gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#00ff88]/60 to-transparent" />

      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-5 py-6">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full shrink-0 ring-2 ring-[#00ff88]/30 ring-offset-2 ring-offset-black"
          style={{ background: addressToGradient(address) }}
        />

        {/* Address + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg text-white tracking-wide">
              {formatAddress(address)}
            </span>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white transition-colors"
              title="Copy address"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#00ff88]">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Links row */}
          <div className="flex items-center gap-4 mt-2">
            <a
              href={getAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#00ff88] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Polygonscan
            </a>
          </div>
        </div>

        {/* Disconnect */}
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          className="shrink-0"
        >
          Disconnect
        </Button>
      </CardContent>
    </Card>
  );
}
