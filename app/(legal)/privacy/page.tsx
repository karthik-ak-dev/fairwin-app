'use client';

import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';

const SECTIONS = [
  {
    title: '1. What We Collect',
    content:
      'FairWin collects minimal data, limited to what is strictly necessary for the Platform to function:',
    bullets: [
      'Wallet address — your public Polygon wallet address, used to identify you on the platform and process entries/payouts.',
      'Transaction data — records of your raffle entries, wins, and payouts as recorded on the Polygon blockchain.',
      'Usage analytics — anonymous, aggregated data about how the Platform is used (e.g., page views, feature usage). No personal identifiers are linked to this data.',
    ],
  },
  {
    title: '2. What We Don\'t Collect',
    content:
      'We are committed to minimizing data collection. FairWin does NOT collect:',
    bullets: [
      'Your name, email address, or phone number.',
      'Your physical address or location data.',
      'Government-issued identification (no KYC required).',
      'Private keys or seed phrases — we NEVER have access to your wallet.',
      'Browsing history or cookies for tracking purposes.',
      'Social media profiles or third-party account data.',
    ],
  },
  {
    title: '3. How We Use Data',
    content:
      'The data we collect is used exclusively for the following purposes:',
    bullets: [
      'To operate the Platform — processing raffle entries, drawing winners, and distributing prizes via smart contracts.',
      'To display your activity — showing your entries, wins, and history on your account page.',
      'To improve the Platform — using aggregated, anonymous analytics to enhance user experience and performance.',
      'To ensure fairness — verifying that all draws are conducted fairly using Chainlink VRF.',
    ],
  },
  {
    title: '4. Blockchain Transparency',
    content:
      'FairWin operates on the Polygon blockchain. By nature, all transactions on a public blockchain are transparent and immutable. This means your wallet address and transaction history on FairWin are publicly visible on the blockchain (e.g., via Polygonscan). This transparency is a feature, not a bug — it enables anyone to independently verify the fairness of every raffle.',
  },
  {
    title: '5. Third Parties',
    content:
      'FairWin integrates with the following third-party services:',
    bullets: [
      'Chainlink VRF — provides verifiable random numbers for fair winner selection. Chainlink does not receive any personal data from FairWin.',
      'Polygon Network — the blockchain on which FairWin operates. Transactions are processed by Polygon validators.',
      'RainbowKit / WalletConnect — wallet connection services. These services may have their own privacy policies.',
      'Analytics Provider — we may use a privacy-focused analytics tool (e.g., Plausible, Fathom) that does not use cookies or track personal data.',
    ],
    afterContent:
      'We do not sell, rent, or share your data with any third parties for marketing or advertising purposes.',
  },
  {
    title: '6. Your Rights',
    content:
      'Because FairWin collects minimal data and does not require personal information, traditional data subject rights (access, deletion, portability) have limited applicability. However:',
    bullets: [
      'You can disconnect your wallet at any time to stop interacting with the Platform.',
      'Blockchain data is immutable and cannot be deleted — this is inherent to blockchain technology.',
      'You may contact us at any time to inquire about what data (if any) we hold beyond on-chain records.',
      'If applicable law grants you specific privacy rights, we will honor them to the extent possible.',
    ],
  },
  {
    title: '7. Contact',
    content:
      'If you have any questions about this Privacy Policy or our data practices, please contact us:',
    contact: true,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-24">
        <div className="max-w-[800px] mx-auto px-6">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#888888] text-sm uppercase tracking-[0.15em]">
              Last updated: January 28, 2026
            </p>
          </div>

          {/* TL;DR Highlight Box */}
          <div className="mb-12 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.05] p-6">
            <p className="text-[#00ff88] font-semibold text-sm uppercase tracking-[0.1em] mb-2">
              TL;DR
            </p>
            <p className="text-white text-base leading-relaxed">
              We don&apos;t require personal info. Your wallet address is your
              identity. We collect only what&apos;s needed to run provably fair
              raffles on the blockchain.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-0">
            {SECTIONS.map((section, i) => (
              <section
                key={i}
                className="border-t border-white/[0.08] py-8"
              >
                <h2 className="text-lg font-semibold text-white mb-4">
                  {section.title}
                </h2>
                <p className="text-[#888888] text-sm leading-relaxed">
                  {section.content}
                </p>
                {section.bullets && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((bullet, j) => (
                      <li
                        key={j}
                        className="text-[#888888] text-sm leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#00ff88]"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {section.afterContent && (
                  <p className="text-[#888888] text-sm leading-relaxed mt-4">
                    {section.afterContent}
                  </p>
                )}
                {section.contact && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-[#888888]">
                      Email:{' '}
                      <a
                        href="mailto:privacy@fairwin.io"
                        className="text-[#00ff88] hover:underline"
                      >
                        privacy@fairwin.io
                      </a>
                    </p>
                    <p className="text-sm text-[#888888]">
                      Twitter:{' '}
                      <a
                        href="https://twitter.com/fairwin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00ff88] hover:underline"
                      >
                        @fairwin
                      </a>
                    </p>
                    <p className="text-sm text-[#888888]">
                      Discord:{' '}
                      <a
                        href="https://discord.gg/fairwin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00ff88] hover:underline"
                      >
                        discord.gg/fairwin
                      </a>
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
