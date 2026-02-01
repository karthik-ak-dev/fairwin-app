'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'What is FairWin?',
    a: 'FairWin is a decentralized raffle platform on Polygon. Every draw uses Chainlink VRF for provably fair randomness, and all payouts are handled automatically by smart contracts. No sign-ups, no KYC — just connect your wallet.',
  },
  {
    q: 'How do I enter a raffle?',
    a: 'Connect your Web3 wallet (MetaMask, Coinbase Wallet, etc.) to Polygon, then browse active raffles and purchase entries with USDC. More entries = better odds of winning.',
  },
  {
    q: 'Is it really fair?',
    a: 'Yes. Winners are selected using Chainlink VRF (Verifiable Random Function), which generates a random number with a cryptographic proof that it was generated correctly. This proof is verified on-chain before the result is used. You can independently verify every draw.',
  },
  {
    q: 'How are winners paid?',
    a: 'Winners receive 90% of the prize pool automatically via the smart contract. The payout is sent in USDC directly to the winner\'s wallet — no claims, no delays, no conditions.',
  },
  {
    q: 'What are the fees?',
    a: 'FairWin charges a flat 10% platform fee, which is hardcoded into the smart contract. This covers operating costs, Chainlink VRF fees, gas costs, and development. There are no hidden fees.',
  },
  {
    q: 'What blockchain does FairWin use?',
    a: 'FairWin runs on Polygon, which offers fast and affordable transactions while maintaining Ethereum-level security. Gas fees are typically just a few cents.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-[800px] mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[#888888]">
            Everything you need to know about FairWin.
          </p>
        </div>

        <div className="space-y-0">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border-t border-white/[0.08] last:border-b"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-white font-medium pr-4 group-hover:text-[#00ff88] transition-colors">
                  {faq.q}
                </span>
                <span
                  className="text-[#888888] text-xl flex-shrink-0 transition-transform duration-200"
                  style={{
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? 'max-h-96 pb-5' : 'max-h-0'
                }`}
              >
                <p className="text-[#888888] text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
