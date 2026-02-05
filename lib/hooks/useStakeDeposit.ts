'use client';

import { useState } from 'react';

export const useStakeDeposit = () => {
  const [amount, setAmount] = useState<string>('2500');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dummy wallet data
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f4a8e';
  const depositWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f4a8e';
  const isWalletConnected = true;

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
  const canStake = isValidAmount && isWalletConnected && !isProcessing;

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

  // Handle stake submission
  const handleStake = async () => {
    if (!canStake) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    alert(`Successfully staked ${numericAmount} USDT!`);
    setIsProcessing(false);
    setAmount('');
  };

  return {
    // State
    amount,
    isProcessing,

    // Wallet info
    walletAddress,
    depositWallet,
    isWalletConnected,

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
    handleStake,
  };
};
