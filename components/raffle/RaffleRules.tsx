const RULES = [
  {
    icon: '🔗',
    text: 'Chainlink VRF Verified',
    detail: 'Provably random winner selection',
  },
  {
    icon: '💰',
    text: '90% to Winners',
    detail: 'Industry-leading payout ratio',
  },
  {
    icon: '⚡',
    text: 'Results in Real Time',
    detail: 'Watch the draw happen live on-chain',
  },
  {
    icon: '🔍',
    text: '100% Verifiable',
    detail: 'Every draw auditable on Polygon',
  },
  {
    icon: '🛡️',
    text: 'Non-Custodial',
    detail: 'Smart contract holds all funds',
  },
  {
    icon: '🎯',
    text: 'Top 10% Win',
    detail: 'More winners than any other platform',
  },
];

export default function RaffleRules() {
  return (
    <div className="rounded-2xl border border-[#00ff88]/10 bg-[#00ff88]/[0.02] p-6">
      <h3 className="text-lg font-bold text-white mb-1">
        Why FairWin is <span className="text-[#00ff88]">Provably Fair</span>
      </h3>
      <p className="text-sm text-[#888888] mb-5">
        Every raffle is transparent, verifiable, and trustless.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RULES.map((rule) => (
          <div
            key={rule.text}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]"
          >
            <span className="text-xl flex-shrink-0">{rule.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{rule.text}</p>
              <p className="text-xs text-[#888888] mt-0.5">{rule.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
