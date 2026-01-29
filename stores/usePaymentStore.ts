'use client';

import { create } from 'zustand';

type PaymentStep = 'idle' | 'approving' | 'entering' | 'confirming' | 'success' | 'error';

interface PaymentState {
  // Current entry flow
  step: PaymentStep;
  quantity: number;
  totalAmount: number;
  entryPrice: number;
  raffleId: string | null;
  txHash: string | null;
  error: string | null;

  // Actions
  setQuantity: (qty: number) => void;
  startEntry: (raffleId: string, entryPrice: number, quantity: number) => void;
  setStep: (step: PaymentStep) => void;
  setTxHash: (hash: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  step: 'idle' as PaymentStep,
  quantity: 1,
  totalAmount: 0,
  entryPrice: 0,
  raffleId: null as string | null,
  txHash: null as string | null,
  error: null as string | null,
};

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,

  setQuantity: (qty) =>
    set((s) => ({
      quantity: qty,
      totalAmount: qty * s.entryPrice,
    })),

  startEntry: (raffleId, entryPrice, quantity) =>
    set({
      raffleId,
      entryPrice,
      quantity,
      totalAmount: entryPrice * quantity,
      step: 'approving',
      error: null,
      txHash: null,
    }),

  setStep: (step) => set({ step }),
  setTxHash: (hash) => set({ txHash: hash }),
  setError: (error) => set({ error, step: 'error' }),
  reset: () => set(initialState),
}));
