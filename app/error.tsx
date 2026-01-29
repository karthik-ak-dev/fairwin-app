'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-6xl mb-6">⚠️</div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-[#888] mb-2 leading-relaxed">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs font-mono text-[#444] mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {!error.digest && <div className="mb-6" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#00ff88] text-black font-semibold rounded-lg hover:bg-[#00e07a] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-[#333] text-white rounded-lg hover:border-[#00ff88] hover:text-[#00ff88] transition-colors"
          >
            Go Home
          </a>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-[#555]">
          If this keeps happening, try refreshing the page or clearing your browser cache.
        </p>
      </div>
    </div>
  );
}
