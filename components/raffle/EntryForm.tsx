'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUSDC } from '@/shared/utils/format';
import { useTokenBalance } from '@/shared/hooks/useTokenBalance';
import { useTokenApproval } from '@/shared/hooks/useTokenApproval';
import QuantitySelector from './QuantitySelector';
import type { Address } from 'viem';

interface EntryFormProps {
  entryPrice: number;
  maxEntries: number;
  totalEntries: number;
  onSubmit: (quantity: number) => void;
  isSubmitting?: boolean;
}

export default function EntryForm({
  entryPrice,
  maxEntries,
  totalEntries,
  onSubmit,
  isSubmitting = false,
}: EntryFormProps) {
  const [quantity, setQuantity] = useState(1);
  const { address } = useAccount();

  const totalCost = entryPrice * quantity;
  const oddsRatio = Math.max(1, Math.round((totalEntries + quantity) / quantity));

  const { balanceNumber, isLoading: balanceLoading } = useTokenBalance({
    address: address as Address | undefined,
  });
  const { isApproved, approve, isApproving } = useTokenApproval({
    owner: address as Address | undefined,
    amount: totalCost,
  });

  const insufficientBalance = !balanceLoading && balanceNumber < totalCost;

  const handleSubmit = async () => {
    if (isSubmitting || isApproving) return;

    if (!isApproved) {
      try {
        await approve();
      } catch {
        return;
      }
    }

    onSubmit(quantity);
  };

  const buttonDisabled = isSubmitting || isApproving || insufficientBalance;

  const buttonLabel = insufficientBalance
    ? 'Insufficient USDC Balance'
    : isApproving
    ? 'Approving USDC...'
    : isSubmitting
    ? 'Processing...'
    : !isApproved
    ? `Approve & Enter — ${formatUSDC(totalCost)}`
    : `🎟️ Enter Raffle — ${formatUSDC(totalCost)}`;

  return (
    <div className="space-y-6">
      {/* Entry Price Display */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <span className="text-sm text-[#888888]">Entry Price</span>
        <span className="text-xl font-bold font-mono text-[#00ff88]">
          {formatUSDC(entryPrice)}
        </span>
      </div>

      {/* USDC Balance */}
      {address && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[#888888]">Your USDC Balance</span>
          <span className="text-xs font-mono text-white">
            {balanceLoading ? '...' : formatUSDC(balanceNumber)}
          </span>
        </div>
      )}

      {/* Quantity Selector */}
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        max={maxEntries}
      />

      {/* Calculation Section */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888888]">Entry Price</span>
          <span className="text-white font-mono">{formatUSDC(entryPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888888]">Quantity</span>
          <span className="text-white font-mono">× {quantity}</span>
        </div>
        <div className="border-t border-white/[0.06]" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-lg font-bold font-mono text-[#00ff88]">
            {formatUSDC(totalCost)} USDC
          </span>
        </div>
      </div>

      {/* Odds Display */}
      <div className="text-center py-3 rounded-xl bg-[#00ff88]/[0.04] border border-[#00ff88]/10">
        <span className="text-sm text-[#888888]">Your Chance: </span>
        <span className="text-sm font-bold text-[#00ff88]">
          ~1 in {oddsRatio.toLocaleString()}
        </span>
      </div>

      {/* Enter Button */}
      <button
        onClick={handleSubmit}
        disabled={buttonDisabled}
        type="button"
        className={`w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all duration-200 ${
          buttonDisabled
            ? 'bg-[#00ff88]/50 text-black/50 cursor-not-allowed'
            : 'bg-[#00ff88] text-black hover:brightness-110 hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] active:scale-[0.98]'
        }`}
      >
        {isSubmitting || isApproving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {buttonLabel}
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      <p className="text-center text-[10px] text-[#555]">
        Entry is final. Funds are locked in the smart contract until the draw.
      </p>
    </div>
  );
}
