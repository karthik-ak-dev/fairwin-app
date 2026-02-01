'use client';

import { useAccount } from 'wagmi';
import type { Raffle } from '@/features/raffle/types';
import { useEnterRaffle } from '@/lib/hooks/raffle/useEnterRaffle';
import RaffleHeader from './RaffleHeader';
import PrizePoolCard from './PrizePoolCard';
import PrizeBreakdown from './PrizeBreakdown';
import RaffleStats from './RaffleStats';
import ParticipantsList from './ParticipantsList';
import PastWinners from './PastWinners';
import EntryCard from './EntryCard';

interface RaffleDetailViewProps {
  raffle: Raffle;
}

export default function RaffleDetailView({ raffle }: RaffleDetailViewProps) {
  const { address, isConnected } = useAccount();
  const enterRaffle = useEnterRaffle(raffle.id);

  const isEnding = raffle.state === 'ending';

  const handleConnect = () => {
    const connectBtn = document.querySelector('[data-testid="rk-connect-button"]') as HTMLButtonElement;
    connectBtn?.click();
  };

  const handleSubmit = (quantity: number) => {
    if (!address) return;
    enterRaffle.enter({
      walletAddress: address,
      numEntries: quantity,
      entryPrice: raffle.entryPrice,
    });
  };

  return (
    <div>
      {isEnding && (
        <div className="mb-6 py-3 px-4 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-[#f97316] uppercase tracking-wider animate-pulse">
            Ending Soon — Enter Before Time Runs Out!
          </span>
        </div>
      )}

      <RaffleHeader raffle={raffle} />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6 min-w-0">
          <PrizePoolCard
            prizePool={raffle.prizePool}
            totalEntries={raffle.totalEntries}
            status={raffle.state}
          />
          <PrizeBreakdown
            prizePool={raffle.prizePool}
            totalEntries={raffle.totalEntries}
          />
          <RaffleStats raffle={raffle} />
          <ParticipantsList raffleId={raffle.id} />
          <PastWinners raffleId={raffle.id} />
        </div>

        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="sticky top-24">
            <EntryCard
              raffleId={raffle.id}
              isConnected={isConnected}
              hasEntered={enterRaffle.isSuccess}
              userEntries={0}
              entryPrice={raffle.entryPrice}
              maxEntries={raffle.maxEntriesPerUser}
              totalEntries={raffle.totalEntries}
              onConnect={handleConnect}
              onSubmit={handleSubmit}
              isEnding={isEnding}
              isEntering={enterRaffle.isEntering}
              entryError={enterRaffle.error}
              txHash={enterRaffle.txHash}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
