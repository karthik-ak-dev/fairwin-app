'use client';

import { RAFFLE_TYPES } from '@/features/raffle/constants';
import type { RaffleType } from '@/features/raffle/types';

interface FilterTabsProps {
  activeFilter: RaffleType | 'all';
  onFilterChange: (filter: RaffleType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ALL_TABS: { value: RaffleType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...RAFFLE_TYPES.map((t) => ({ value: t.value, label: t.label })),
];

export default function FilterTabs({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: FilterTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      {/* Tab bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#00ff88] text-black'
                    : 'bg-white/[0.05] text-[#888888] hover:bg-white/[0.08] hover:text-white'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <div className="relative w-full sm:w-auto">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search raffles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-[#888888] focus:outline-none focus:border-[#00ff88]/40 transition-colors"
        />
      </div>
    </div>
  );
}
