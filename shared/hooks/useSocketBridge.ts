'use client';

import { useMutation } from '@tanstack/react-query';
import { useSendTransaction } from 'wagmi';

export function useSocketBridge() {
  const { sendTransactionAsync } = useSendTransaction();

  return useMutation({
    mutationFn: async (bridgeData: { txTarget: string; txData: string; value: string }) => {
      const hash = await sendTransactionAsync({
        to: bridgeData.txTarget as `0x${string}`,
        data: bridgeData.txData as `0x${string}`,
        value: BigInt(bridgeData.value),
      });
      return hash;
    },
  });
}
