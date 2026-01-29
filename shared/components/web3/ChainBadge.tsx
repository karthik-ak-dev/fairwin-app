'use client';

interface ChainBadgeProps {
  isCorrectChain: boolean;
  onSwitch?: () => void;
}

export default function ChainBadge({ isCorrectChain, onSwitch }: ChainBadgeProps) {
  if (isCorrectChain) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1.5">
        <span className="text-sm" role="img" aria-label="Polygon">
          🟣
        </span>
        <span className="text-xs font-medium text-purple-400">Polygon</span>
        <span className="h-2 w-2 rounded-full bg-green-500" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5">
      <span className="text-xs font-medium text-red-400">⚠️ Wrong Network</span>
      {onSwitch && (
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs font-bold text-red-300 hover:text-white transition-colors underline underline-offset-2"
        >
          Switch
        </button>
      )}
    </div>
  );
}
