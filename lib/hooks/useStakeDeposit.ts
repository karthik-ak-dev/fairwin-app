'use client';

import { useState } from 'react';

export const useStakeDeposit = () => {
  const [amount, setAmount] = useState<string>('2500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingStake, setPendingStake] = useState<{
    id: string;
    amount: number;
    status: 'pending' | 'awaiting_payment';
  } | null>(null);

  // Central wallet for deposits (dummy address)
  const centralWallet = '0x1234567890AbcdEF1234567890aBcdef12345678';
  const isAuthenticated = true; // User is logged in via Google SSO

  // Dummy existing stakes
  const existingStakes = [
    { id: '1', amount: 5000, startDate: '2025-12-01', monthsElapsed: 2 },
    { id: '2', amount: 1500, startDate: '2026-01-15', monthsElapsed: 0 },
  ];

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

  // Total stats across all stakes
  const totalStaked = existingStakes.reduce((sum, stake) => sum + stake.amount, 0);
  const totalActiveStakes = existingStakes.length;

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

    // Simulate API call to create pending stake
    // In real implementation:
    // 1. POST /api/stakes/create with amount
    // 2. Backend validates amount (min/max)
    // 3. Backend creates stake record with status="awaiting_payment"
    // 4. Backend returns stakeId and central wallet address
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newStake = {
      id: `stake_${Date.now()}`,
      amount: numericAmount,
      status: 'awaiting_payment' as const,
    };

    setPendingStake(newStake);
    setIsProcessing(false);
  };

  // Step 2: Submit transaction hash to verify payment
  const handleSubmitTxHash = async (txHash: string) => {
    if (!pendingStake || !txHash) return;

    setIsProcessing(true);

    // Simulate transaction verification
    // In real implementation:
    // 1. POST /api/stakes/verify-payment with stakeId and txHash
    // 2. Backend verifies transaction hash on BSC
    // 3. Check amount matches pendingStake.amount
    // 4. Check destination is centralWallet
    // 5. Update stake status to "active"
    // 6. Send confirmation email
    await new Promise(resolve => setTimeout(resolve, 2500));

    alert(`Transaction ${txHash.slice(0, 10)}... verified!\nSuccessfully staked ${pendingStake.amount} USDT!`);

    // Reset state
    setIsProcessing(false);
    setPendingStake(null);
    setAmount('');
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
