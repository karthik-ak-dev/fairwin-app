'use client';

import { useRaffle } from '@/features/raffle/hooks/useRaffle';
import { useAccount } from 'wagmi';
import RaffleDetailView from './RaffleDetailView';
import DrawingState from './DrawingState';
import ResultWon from './ResultWon';
import ResultLost from './ResultLost';
import { Skeleton } from '@/shared/components/ui';
import type { WinnerItem } from '@/lib/db/models';

interface RaffleDetailProps {
  raffleId: string;
}

function RaffleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="w-48 h-6 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-[200px] rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function RaffleDetail({ raffleId }: RaffleDetailProps) {
  const { raffle, winners, isLoading, error } = useRaffle(raffleId);
  const { address } = useAccount();

  if (isLoading) {
    return <RaffleDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Raffle</h2>
          <p className="text-sm text-[#888888]">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] max-w-md w-full">
          <span className="text-[48px] block mb-4">🔍</span>
          <h2 className="text-xl font-bold text-white mb-2">Raffle Not Found</h2>
          <p className="text-sm text-[#888888]">
            This raffle doesn&apos;t exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (raffle.state === 'drawing') {
    return <DrawingState onComplete={() => {}} />;
  }

  if (raffle.state === 'ended') {
    const userWon = winners?.some(
      (w: WinnerItem) => w.walletAddress.toLowerCase() === address?.toLowerCase()
    );
    const userWin = winners?.find(
      (w: WinnerItem) => w.walletAddress.toLowerCase() === address?.toLowerCase()
    );

    if (userWon && userWin) {
      return (
        <ResultWon
          prize={userWin.prize}
          tier={userWin.tier}
          raffleTitle={raffle.title}
          txHash={userWin.transactionHash}
        />
      );
    }

    return (
      <ResultLost
        raffleTitle={raffle.title}
        winners={winners ?? []}
        totalEntries={raffle.totalEntries}
      />
    );
  }

  return <RaffleDetailView raffle={raffle} />;
}
