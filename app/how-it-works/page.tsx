'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';

/* ─── Feature Cards ─── */
const FEATURES = [
  {
    icon: '🔗',
    title: 'On-Chain',
    desc: 'Every transaction, entry, and payout is recorded on Polygon.',
  },
  {
    icon: '🎲',
    title: 'Chainlink VRF',
    desc: 'Randomness you can cryptographically verify.',
  },
  {
    icon: '💰',
    title: 'Instant Payouts',
    desc: 'Winners receive USDC directly to their wallet.',
  },
  {
    icon: '🔍',
    title: 'Open Source',
    desc: 'Smart contracts are verified and auditable by anyone.',
  },
];

/* ─── Steps ─── */
const STEPS = [
  {
    num: '01',
    title: 'Connect Wallet',
    desc: 'Connect your MetaMask or any Web3 wallet to the Polygon network. No sign-ups, no personal information required.',
    icon: '🔗',
  },
  {
    num: '02',
    title: 'Enter a Raffle',
    desc: 'Browse active raffles and purchase entries using USDC. Choose how many entries you want — more entries = better odds.',
    icon: '🎫',
  },
  {
    num: '03',
    title: 'VRF Draws Winner',
    desc: 'When the raffle ends, Chainlink VRF generates a provably random number. The smart contract uses this to select the winner.',
    icon: '🎲',
  },
  {
    num: '04',
    title: 'Winner Gets Paid',
    desc: 'The winner automatically receives 90% of the prize pool in USDC. No claims, no delays — it\'s sent to your wallet instantly.',
    icon: '💸',
  },
];

/* ─── FAQ ─── */
const FAQS = [
  {
    q: 'What is Chainlink VRF?',
    a: 'Chainlink VRF (Verifiable Random Function) is a provably fair and verifiable source of randomness designed for smart contracts. It generates a random number along with a cryptographic proof that the number was generated correctly. This proof is verified on-chain before the result is used.',
  },
  {
    q: 'Can FairWin manipulate the results?',
    a: 'No. The winner is determined entirely by the smart contract using Chainlink VRF. Neither FairWin nor any other party can influence, predict, or manipulate the random number used to select the winner. The smart contract code is verified and open for anyone to audit.',
  },
  {
    q: 'How do I verify a draw?',
    a: 'Every raffle draw generates a transaction hash and a VRF request ID. You can use our Verify page to look up any draw and see the full cryptographic proof, or check it directly on Polygonscan and Chainlink\'s VRF explorer.',
  },
  {
    q: 'What happens if the VRF callback fails?',
    a: 'The smart contract has built-in safeguards. If the VRF callback fails, the raffle remains in a "drawing" state and the request is retried. If it cannot be fulfilled, participants can reclaim their entries. No funds are ever lost.',
  },
  {
    q: 'Why Polygon?',
    a: 'Polygon offers fast, low-cost transactions while maintaining Ethereum-level security. This means entering a raffle costs only a few cents in gas fees, making FairWin accessible to everyone.',
  },
  {
    q: 'What currency are prizes paid in?',
    a: 'All entries and prizes are denominated in USDC, a stablecoin pegged to the US Dollar. This means your winnings maintain their value — no volatility risk.',
  },
];

/* ─── VRF Code Example ─── */
const VRF_CODE = `// Chainlink VRF v2 — FairWin Integration
function fulfillRandomWords(
  uint256 requestId,
  uint256[] memory randomWords
) internal override {
  Raffle storage raffle = raffles[requestId];
  
  // Use verifiable random number to pick winner
  uint256 winnerIndex = randomWords[0] % raffle.totalEntries;
  address winner = raffle.entries[winnerIndex];
  
  // Auto-pay winner (90% of pool)
  uint256 prize = (raffle.prizePool * 90) / 100;
  USDC.transfer(winner, prize);
  
  emit WinnerSelected(raffle.id, winner, prize);
}`;

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-24">
        {/* ─── HERO ─── */}
        <section className="text-center max-w-[900px] mx-auto px-6 mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/[0.05] px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-medium text-[#00ff88] uppercase tracking-[0.15em]">
              Powered by Chainlink VRF
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Provably Fair.{' '}
            <span className="text-[#00ff88]">100% Transparent.</span>
          </h1>
          <p className="text-[#888888] text-lg md:text-xl max-w-[700px] mx-auto leading-relaxed">
            Every raffle on FairWin is powered by Chainlink VRF and settled
            on-chain. No hidden algorithms. No house edge manipulation. Just
            pure, verifiable randomness.
          </p>
        </section>

        {/* ─── 01 — What is FairWin ─── */}
        <section className="max-w-[1200px] mx-auto px-6 mb-24">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-5xl font-bold text-[#00ff88]/20 font-mono">01</span>
            <h2 className="text-2xl md:text-3xl font-bold">What is FairWin?</h2>
          </div>
          <p className="text-[#888888] text-base leading-relaxed max-w-[700px] mb-12">
            FairWin is a decentralized raffle platform built on Polygon.
            It uses Chainlink VRF for provably fair winner selection and
            smart contracts for automatic, trustless prize distribution.
            No accounts, no KYC — just connect your wallet and play.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-[#00ff88]/20 transition-colors"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-[#888888] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 02 — How the Raffle Works ─── */}
        <section className="max-w-[1200px] mx-auto px-6 mb-24">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-5xl font-bold text-[#00ff88]/20 font-mono">02</span>
            <h2 className="text-2xl md:text-3xl font-bold">How the Raffle Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 text-4xl font-mono font-bold text-white/[0.05]">
                  {step.num}
                </span>
                <span className="text-3xl mb-4 block">{step.icon}</span>
                <h3 className="text-white font-semibold text-lg mb-3">
                  {step.title}
                </h3>
                <p className="text-[#888888] text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 03 — Chainlink VRF ─── */}
        <section className="max-w-[1200px] mx-auto px-6 mb-24">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-5xl font-bold text-[#00ff88]/20 font-mono">03</span>
            <h2 className="text-2xl md:text-3xl font-bold">Chainlink VRF</h2>
          </div>
          <p className="text-[#888888] text-base leading-relaxed max-w-[700px] mb-8">
            Chainlink VRF (Verifiable Random Function) provides cryptographically
            secure randomness that is verifiable on-chain. Every random number
            comes with a proof that it was generated fairly — and this proof is
            verified before the result is accepted by the smart contract.
          </p>
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 text-xs text-[#888888] font-mono">
                FairWinRaffle.sol
              </span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
              <code className="font-mono text-[#888888]">{VRF_CODE}</code>
            </pre>
          </div>
        </section>

        {/* ─── 04 — Fee Structure ─── */}
        <section className="max-w-[1200px] mx-auto px-6 mb-24">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-5xl font-bold text-[#00ff88]/20 font-mono">04</span>
            <h2 className="text-2xl md:text-3xl font-bold">Fee Structure</h2>
          </div>
          <p className="text-[#888888] text-base leading-relaxed max-w-[700px] mb-8">
            Simple, transparent, and hardcoded into the smart contract. No hidden
            fees, no variable rates, no surprises.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Winner Card */}
            <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] p-8 text-center">
              <span className="text-6xl font-bold text-[#00ff88] block mb-2">
                90%
              </span>
              <h3 className="text-white font-semibold text-lg mb-3">
                Winner Gets
              </h3>
              <p className="text-[#888888] text-sm leading-relaxed">
                The winner receives 90% of the total prize pool, automatically
                sent to their wallet in USDC. No claims, no delays.
              </p>
            </div>
            {/* Platform Card */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <span className="text-6xl font-bold text-white/30 block mb-2">
                10%
              </span>
              <h3 className="text-white font-semibold text-lg mb-3">
                Platform Fee
              </h3>
              <p className="text-[#888888] text-sm leading-relaxed">
                FairWin retains 10% to cover operating costs, Chainlink VRF fees,
                gas costs, and platform development.
              </p>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="max-w-[800px] mx-auto px-6 mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-0">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border-t border-white/[0.08] last:border-b"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="text-white font-medium pr-4 group-hover:text-[#00ff88] transition-colors">
                    {faq.q}
                  </span>
                  <span className="text-[#888888] text-xl flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="text-[#888888] text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="text-center max-w-[700px] mx-auto px-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Try?
            </h2>
            <p className="text-[#888888] mb-8 max-w-[500px] mx-auto">
              Join thousands of players winning USDC in provably fair raffles.
              Connect your wallet and enter in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-[#00ff88] px-8 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Enter a Raffle →
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-8 py-3 text-sm font-medium text-white transition-colors hover:border-white/20"
              >
                Verify a Draw
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
