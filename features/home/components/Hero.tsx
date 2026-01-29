'use client';

import Link from 'next/link';
import HeroStats from './HeroStats';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#00ff88]/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/[0.05] px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-xs font-medium text-[#00ff88] uppercase tracking-[0.15em]">
                Live on Polygon
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              THE FAIREST
              <br />
              WAY TO{' '}
              <span className="text-[#00ff88]">WIN</span>
            </h1>

            <p className="text-[#888888] text-lg md:text-xl max-w-[500px] leading-relaxed mb-8">
              Provably fair on-chain raffles powered by Chainlink VRF. Every
              draw is transparent, every payout is automatic. No house edge
              manipulation — just pure, verifiable randomness.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/games/raffle"
                className="inline-flex items-center justify-center rounded-lg bg-[#00ff88] px-8 py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Enter a Raffle →
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/20"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Right — Stats */}
          <div className="flex justify-center lg:justify-end">
            <HeroStats />
          </div>
        </div>
      </div>
    </section>
  );
}
