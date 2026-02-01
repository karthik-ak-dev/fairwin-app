import type { Raffle } from '@/features/raffle/types';
import RaffleCard from './RaffleCard';

interface RaffleListProps {
  raffles: Raffle[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
          <div>
            <div className="w-36 h-5 rounded bg-white/[0.06] mb-2" />
            <div className="w-24 h-3 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="w-16 h-6 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mb-4">
        <div className="w-16 h-3 rounded bg-white/[0.04] mb-2" />
        <div className="w-32 h-8 rounded bg-white/[0.06]" />
      </div>
      <div className="flex justify-between mb-3">
        <div className="w-24 h-4 rounded bg-white/[0.06]" />
        <div className="w-20 h-4 rounded bg-white/[0.06]" />
      </div>
      <div className="w-40 h-3 rounded bg-white/[0.04] mb-5" />
      <div className="border-t border-white/[0.06] my-4" />
      <div className="flex justify-between items-center">
        <div>
          <div className="w-16 h-3 rounded bg-white/[0.04] mb-1" />
          <div className="w-20 h-4 rounded bg-white/[0.06]" />
        </div>
        <div className="w-20 h-9 rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}

export default function RaffleList({ raffles, loading }: RaffleListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (raffles.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl mb-4 block">🎟️</span>
        <h3 className="text-xl font-bold text-white mb-2">No Raffles Found</h3>
        <p className="text-[#888888] text-sm">
          Try adjusting your filters or check back soon for new raffles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {raffles.map((raffle) => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  );
}
