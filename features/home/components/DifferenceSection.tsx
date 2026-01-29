'use client';

const COMPARISONS = [
  {
    feature: 'Randomness',
    traditional: 'Hidden algorithms, server-side RNG',
    fairwin: 'Chainlink VRF — cryptographically verifiable',
  },
  {
    feature: 'Transparency',
    traditional: 'Closed source, trust-based',
    fairwin: 'Open-source smart contracts on Polygon',
  },
  {
    feature: 'Payouts',
    traditional: 'Manual, delayed, conditions apply',
    fairwin: 'Automatic, instant, via smart contract',
  },
  {
    feature: 'House Edge',
    traditional: 'Variable, often undisclosed',
    fairwin: 'Fixed 10% fee, hardcoded in contract',
  },
  {
    feature: 'Verification',
    traditional: 'Impossible — you just trust them',
    fairwin: 'Full on-chain proof for every draw',
  },
  {
    feature: 'KYC Required',
    traditional: 'Yes — ID, address, selfie',
    fairwin: 'No — just connect your wallet',
  },
];

export default function DifferenceSection() {
  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            FairWin vs <span className="text-[#888888]">Traditional</span>
          </h2>
          <p className="text-[#888888] text-lg max-w-[600px] mx-auto">
            See why provably fair on-chain raffles are the future.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-xl border border-white/[0.08] overflow-hidden max-w-[900px] mx-auto">
          {/* Header */}
          <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/[0.08]">
            <div className="px-6 py-4">
              <span className="text-xs text-[#888888] uppercase tracking-[0.1em]">
                Feature
              </span>
            </div>
            <div className="px-6 py-4 border-l border-white/[0.05]">
              <span className="text-xs text-[#888888] uppercase tracking-[0.1em]">
                Traditional
              </span>
            </div>
            <div className="px-6 py-4 border-l border-[#00ff88]/10 bg-[#00ff88]/[0.03]">
              <span className="text-xs text-[#00ff88] uppercase tracking-[0.1em] font-semibold">
                FairWin
              </span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISONS.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-3 border-b border-white/[0.05] last:border-b-0"
            >
              <div className="px-6 py-4">
                <span className="text-sm font-medium text-white">
                  {c.feature}
                </span>
              </div>
              <div className="px-6 py-4 border-l border-white/[0.05]">
                <span className="text-sm text-[#888888]">
                  ✗ {c.traditional}
                </span>
              </div>
              <div className="px-6 py-4 border-l border-[#00ff88]/10 bg-[#00ff88]/[0.02]">
                <span className="text-sm text-[#00ff88]">
                  ✓ {c.fairwin}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
