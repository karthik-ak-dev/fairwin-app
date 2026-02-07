'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useStakeDeposit = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('2500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingStake, setPendingStake] = useState<{
    id: string;
    amount: number;
    status: 'pending' | 'awaiting_payment';
  } | null>(null);

  // Central wallet from environment variable
  const centralWallet = process.env.NEXT_PUBLIC_DEPOSIT_WALLET_ADDRESS || '';
  const isAuthenticated = !!user;

  // Fetch existing stakes from dashboard API
  const { data: dashboardData } = useSWR(
    isAuthenticated ? '/api/dashboard' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const existingStakes = dashboardData?.stakes || [];
  const totalStaked = dashboardData?.stats?.totalStaked || 0;
  const totalActiveStakes = existingStakes.length;

  // Constants
  const MONTHLY_RATE = 0.08;
  const STAKE_DURATION_MONTHS = 24;
  const MIN_STAKE = 50;
  const MAX_STAKE = 10000;

  // Calculate earnings
  const numericAmount = parseFloat(amount) || 0;
  const monthlyEarnings = numericAmount * MONTHLY_RATE;
  const dailyEarnings = monthlyEarnings / 30;
  const totalEarnings = monthlyEarnings * STAKE_DURATION_MONTHS;

  const calculations = {
    dailyEarnings,
    monthlyEarnings,
    totalEarnings,
    principal: numericAmount,
  };

  // Preset amounts
  const presetAmounts = [500, 2500, 5000, 10000];

  // Validation
  const isValidAmount = numericAmount >= MIN_STAKE && numericAmount <= MAX_STAKE;
  const canStake = isValidAmount && isAuthenticated && !isProcessing;

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    setAmount(sanitized);
  };

  // Handle preset click
  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  // Step 1: Create stake entry with "pending" status
  const handleCreateStake = async () => {
    if (!canStake) return;

    setIsProcessing(true);

    try {
      // Call API to create pending stake
      const response = await fetch('/api/stakes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create stake');
      }

      const newStake = {
        id: result.stake.id,
        amount: numericAmount,
        status: 'awaiting_payment' as const,
      };

      setPendingStake(newStake);
    } catch (error: any) {
      alert(`Error creating stake: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Submit transaction hash to verify payment
  const handleSubmitTxHash = async (txHash: string) => {
    if (!pendingStake || !txHash) return;

    // Validate txHash format (0x + 64 hex characters)
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txHashRegex.test(txHash)) {
      alert('Invalid transaction hash format. Must be 0x followed by 64 hexadecimal characters.');
      return;
    }

    setIsProcessing(true);

    try {
      // Call API to submit transaction hash
      const response = await fetch('/api/stakes/submit-txhash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stakeId: pendingStake.id,
          txHash: txHash,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit transaction hash');
      }

      alert(
        `Transaction ${txHash.slice(0, 10)}... submitted successfully!\n\nYour stake of ${pendingStake.amount} USDT is now being verified.\nYou will be notified once it becomes active.`
      );

      // Reset state
      setPendingStake(null);
      setAmount('');
    } catch (error: any) {
      alert(`Error submitting transaction: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // State
    amount,
    isProcessing,
    pendingStake,

    // Central wallet info
    centralWallet,
    isAuthenticated,

    // Existing stakes
    existingStakes,
    totalStaked,
    totalActiveStakes,

    // Calculations
    calculations,

    // Constants
    MONTHLY_RATE,
    STAKE_DURATION_MONTHS,
    MIN_STAKE,
    MAX_STAKE,
    presetAmounts,

    // Validation
    isValidAmount,
    canStake,

    // Handlers
    handleAmountChange,
    handlePresetClick,
    handleCreateStake,
    handleSubmitTxHash,
  };
};
