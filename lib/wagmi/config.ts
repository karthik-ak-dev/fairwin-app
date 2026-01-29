'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { http } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo';

export const config = getDefaultConfig({
  appName: 'FairWin',
  projectId,
  chains: [
    polygon,
    ...(process.env.NEXT_PUBLIC_CHAIN_ID === '80002' ? [polygonAmoy] : []),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});
