'use client';

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-[800px] mx-auto px-8 text-center">
        <div className="rounded-2xl border border-[#00ff88]/20 bg-gradient-to-b from-[#00ff88]/[0.06] to-transparent p-16 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-[#00ff88]/[0.02] pointer-events-none" />

          <div className="relative">
            <span className="text-5xl mb-6 block">🎰</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Ready to Play?
            </h2>
            <p className="text-[#888888] text-lg mb-8 max-w-[500px] mx-auto leading-relaxed">
              Join thousands of players winning USDC in provably fair raffles.
              Connect your wallet and enter in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/games/raffle"
                className="inline-flex items-center justify-center rounded-lg bg-[#00ff88] px-10 py-4 text-base font-semibold text-black transition-opacity hover:opacity-90"
              >
                Enter a Raffle →
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-10 py-4 text-base font-medium text-white transition-colors hover:border-white/20"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
