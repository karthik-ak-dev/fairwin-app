'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { http } from 'wagmi';
import { env } from '@/lib/env';
import { blockchain } from '@/lib/constants';

export const config = getDefaultConfig({
  appName: 'FairWin',
  projectId: env.WALLETCONNECT_PROJECT_ID,
  chains: [
    polygon,
    ...(env.CHAIN_ID === blockchain.CHAIN_IDS.POLYGON_AMOY_TESTNET ? [polygonAmoy] : []),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});
