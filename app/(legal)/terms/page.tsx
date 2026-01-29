'use client';

import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using FairWin ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use the Platform. These terms constitute a legally binding agreement between you and FairWin.',
  },
  {
    title: '2. Eligibility',
    content:
      'You must be at least 18 years old (or the age of majority in your jurisdiction) to use FairWin. By using the Platform, you represent and warrant that you meet this age requirement. You are responsible for ensuring that your use of FairWin complies with all laws, rules, and regulations applicable to you.',
  },
  {
    title: '3. How It Works',
    content:
      'FairWin operates provably fair raffles on the Polygon blockchain. Each raffle functions as follows:',
    bullets: [
      'Users purchase entries using USDC at a fixed price per entry.',
      'When the raffle period ends (or conditions are met), a winner is drawn.',
      'Winner selection uses Chainlink VRF (Verifiable Random Function) for provably fair randomness.',
      'The winner receives 90% of the total prize pool, automatically paid out by the smart contract.',
      'FairWin retains 10% as a platform fee.',
      'All transactions are recorded on the Polygon blockchain and can be independently verified.',
    ],
  },
  {
    title: '4. Non-Custodial Nature',
    content:
      'FairWin is a non-custodial platform. We never hold, control, or have access to your funds. All entries, prize pools, and payouts are managed entirely by audited smart contracts on the Polygon blockchain. You interact with FairWin by connecting your own Web3 wallet (e.g., MetaMask) and approving transactions directly.',
  },
  {
    title: '5. Fees',
    content:
      'FairWin charges a 10% platform fee on each raffle\'s total prize pool. This fee is automatically deducted by the smart contract before the winner is paid. Additionally, you are responsible for any blockchain gas fees required to submit transactions on the Polygon network. Gas fees are paid in MATIC and are not controlled by FairWin.',
  },
  {
    title: '6. No Guarantees',
    content:
      'Participation in a raffle does not guarantee any winnings. FairWin makes no representations or warranties regarding the likelihood of winning. Each raffle\'s outcome is determined solely by Chainlink VRF and the smart contract logic. Past results do not indicate future performance.',
  },
  {
    title: '7. Risks',
    content:
      'Using FairWin involves inherent risks associated with blockchain technology and cryptocurrency. These include but are not limited to: smart contract vulnerabilities (despite audits), network congestion or downtime, wallet security, token price volatility, and regulatory changes. You acknowledge and accept these risks by using the Platform.',
  },
  {
    title: '8. Prohibited Activities',
    content:
      'When using FairWin, you agree not to:',
    bullets: [
      'Use the Platform for any unlawful purpose or in violation of any applicable regulations.',
      'Attempt to exploit, hack, or interfere with the smart contracts or the Platform\'s infrastructure.',
      'Use bots, scripts, or automated tools to gain an unfair advantage in raffles.',
      'Engage in money laundering, terrorist financing, or any other financial crime.',
      'Impersonate another person or entity.',
      'Circumvent any access restrictions or security measures.',
      'Use the Platform if you are located in a jurisdiction where participation is prohibited.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    content:
      'To the maximum extent permitted by applicable law, FairWin, its founders, developers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.',
  },
  {
    title: '10. Contact',
    content:
      'If you have any questions about these Terms of Service, please contact us at:',
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-24">
        <div className="max-w-[800px] mx-auto px-6">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-[#888888] text-sm uppercase tracking-[0.15em]">
              Last updated: January 28, 2026
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
                {section.contact && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-[#888888]">
                      Email:{' '}
                      <a
                        href="mailto:legal@fairwin.io"
                        className="text-[#00ff88] hover:underline"
                      >
                        legal@fairwin.io
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
