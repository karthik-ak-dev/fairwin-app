'use client';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-[48px] mb-4" role="img" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-[20px] font-bold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#888888] max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 rounded-lg bg-[#00ff88] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#00e07a] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
