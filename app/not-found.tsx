import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Glitch-style 404 */}
        <div className="text-[120px] font-bold leading-none tracking-tighter mb-4">
          <span className="text-gradient-green">4</span>
          <span className="text-white/20">0</span>
          <span className="text-gradient-green">4</span>
        </div>

        {/* Icon */}
        <div className="text-5xl mb-6 animate-float">🎟️</div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-3">
          This raffle doesn&apos;t exist
        </h1>
        <p className="text-[#888] mb-8 leading-relaxed">
          The page you&apos;re looking for has either ended, been drawn, or never existed.
          But there are plenty of active raffles waiting for you.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-[#00ff88] text-black font-semibold rounded-lg hover:bg-[#00e07a] transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/games/raffle"
            className="px-6 py-3 border border-[#333] text-white rounded-lg hover:border-[#00ff88] hover:text-[#00ff88] transition-colors"
          >
            Browse Raffles
          </Link>
        </div>

        {/* Decorative line */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-[#222]" />
          <span className="text-xs text-[#444] uppercase tracking-widest">FairWin</span>
          <div className="h-px w-12 bg-[#222]" />
        </div>
      </div>
    </div>
  );
}
