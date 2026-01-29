'use client';

import ConnectPrompt from './ConnectPrompt';
import EntryForm from './EntryForm';
import { getTransactionUrl } from '@/shared/utils/constants';

interface EntryCardProps {
  raffleId: string;
  isConnected: boolean;
  hasEntered: boolean;
  userEntries: number;
  entryPrice: number;
  maxEntries: number;
  totalEntries: number;
  onConnect: () => void;
  onSubmit: (quantity: number) => void;
  isEnding?: boolean;
  isEntering?: boolean;
  entryError?: Error | null;
  txHash?: string;
}

export default function EntryCard({
  raffleId,
  isConnected,
  hasEntered,
  userEntries,
  entryPrice,
  maxEntries,
  totalEntries,
  onConnect,
  onSubmit,
  isEnding = false,
  isEntering = false,
  entryError,
  txHash,
}: EntryCardProps) {
  const remainingEntries = maxEntries - userEntries;

  return (
    <div
      className={`
        rounded-2xl border p-6 transition-all duration-300
        ${
          isEnding
            ? 'border-[#f97316]/40 bg-gradient-to-b from-[#f97316]/5 to-[#0a0a0a]'
            : 'border-[#00ff88]/20 bg-gradient-to-b from-[#00ff88]/5 to-[#0a0a0a]'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">
          {hasEntered ? '🎟️ Your Entry' : '🎟️ Enter Raffle'}
        </h3>
        {isEnding && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 animate-pulse">
            Ending Soon
          </span>
        )}
      </div>

      {/* Error Display */}
      {entryError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{entryError.message}</p>
        </div>
      )}

      {/* Guest State */}
      {!isConnected && <ConnectPrompt />}

      {/* Connected + Already Entered */}
      {isConnected && hasEntered && (
        <div className="space-y-5">
          {/* Success Banner */}
          <div className="rounded-xl bg-[#00ff88]/[0.08] border border-[#00ff88]/20 p-4 text-center">
            <div className="text-2xl mb-1">✅</div>
            <p className="text-lg font-bold text-[#00ff88]">You&apos;re In!</p>
            <p className="text-sm text-[#888888] mt-1">
              You have{' '}
              <span className="text-white font-bold">{userEntries}</span>{' '}
              {userEntries === 1 ? 'entry' : 'entries'} in this raffle
            </p>
            {txHash && (
              <a
                href={getTransactionUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#00ff88] hover:underline mt-2 inline-block"
              >
                View Transaction ↗
              </a>
            )}
          </div>

          {/* Remaining Entries Info */}
          {remainingEntries > 0 ? (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[#888888]">
                  Entries remaining
                </span>
                <span className="text-xs font-bold text-white">
                  {remainingEntries} of {maxEntries}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00ff88] transition-all duration-500"
                  style={{
                    width: `${(userEntries / maxEntries) * 100}%`,
                  }}
                />
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-xs text-[#888888] mb-4">
                  Want better odds? Add more entries:
                </p>
                <EntryForm
                  entryPrice={entryPrice}
                  maxEntries={remainingEntries}
                  totalEntries={totalEntries}
                  onSubmit={onSubmit}
                  isSubmitting={isEntering}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-[#888888]">
                Maximum entries reached 🎉
              </p>
              <p className="text-xs text-[#555] mt-1">
                You&apos;ve entered the maximum of {maxEntries} entries
              </p>
            </div>
          )}
        </div>
      )}

      {/* Connected + Not Entered Yet */}
      {isConnected && !hasEntered && (
        <EntryForm
          entryPrice={entryPrice}
          maxEntries={maxEntries}
          totalEntries={totalEntries}
          onSubmit={onSubmit}
          isSubmitting={isEntering}
        />
      )}
    </div>
  );
}
