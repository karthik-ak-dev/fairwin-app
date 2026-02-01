'use client';

import Link from 'next/link';

const VERIFY_STEPS = [
  {
    num: '01',
    title: 'Find Transaction',
    desc: 'Every draw produces a unique transaction hash recorded on the Polygon blockchain.',
    icon: '🔍',
  },
  {
    num: '02',
    title: 'Check VRF Proof',
    desc: 'Chainlink VRF provides a cryptographic proof that the random number was generated fairly.',
    icon: '🔐',
  },
  {
    num: '03',
    title: 'Confirm Winner',
    desc: 'The smart contract uses the verified random number to select the winner. Fully deterministic.',
    icon: '✅',
  },
];

export default function VerifySection() {
  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don&apos;t Trust Us —{' '}
            <span className="text-[#00ff88]">Verify</span>
          </h2>
          <p className="text-[#888888] text-lg max-w-[600px] mx-auto">
            Every single raffle draw can be independently verified on-chain.
            Here&apos;s how.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {VERIFY_STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 relative"
            >
              <span className="absolute top-4 right-4 text-3xl font-mono font-bold text-white/[0.05]">
                {step.num}
              </span>
              <span className="text-3xl mb-4 block">{step.icon}</span>
              <h3 className="text-white font-semibold text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-[#888888] text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/verify"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-8 py-3 text-sm font-medium text-white hover:border-white/20 transition-colors"
          >
            Verify a Transaction →
          </Link>
        </div>
      </div>
    </section>
  );
}
