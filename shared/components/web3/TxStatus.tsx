'use client';

import { getTransactionUrl } from '@/shared/utils/constants';

interface TxStatusProps {
  status: 'pending' | 'success' | 'error';
  txHash?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function TxStatus({
  status,
  txHash,
  errorMessage,
  onRetry,
}: TxStatusProps) {
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-3">
        {/* Spinner */}
        <svg
          className="h-5 w-5 animate-spin text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium text-blue-400">
          Confirming...
        </span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#00ff88]/25 bg-[#00ff88]/10 px-4 py-3">
        <span className="text-lg">✅</span>
        <span className="text-sm font-medium text-[#00ff88]">Confirmed</span>
        {txHash && (
          <a
            href={getTransactionUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-[#888888] hover:text-[#00ff88] font-medium transition-colors"
          >
            View TX →
          </a>
        )}
      </div>
    );
  }

  // Error
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#ff4444]/25 bg-[#ff4444]/10 px-4 py-3">
      <span className="text-lg">❌</span>
      <span className="text-sm font-medium text-[#ff4444] flex-1">
        {errorMessage || 'Transaction failed'}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-bold text-[#ff4444] hover:text-white transition-colors underline underline-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}
