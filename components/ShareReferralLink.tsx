'use client';

import { copyToClipboard } from '@/lib/utils/format';

interface ShareReferralLinkProps {
  referralLink: string;
}

export function ShareReferralLink({ referralLink }: ShareReferralLinkProps) {
  return (
    <div className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🔗</span>
        <h3 className="text-lg font-extrabold">Share Your Link</h3>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Referral Link</div>
        <div className="bg-black/30 border border-white/8 rounded-lg p-3 font-mono text-sm text-gold break-all">
          {referralLink}
        </div>
      </div>

      <button
        onClick={() => copyToClipboard(referralLink)}
        className="w-full py-3.5 bg-gold text-black font-bold text-sm rounded-lg uppercase tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
      >
        📋 Copy Referral Link
      </button>
    </div>
  );
}
