import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FairWin — The Fairest Way to Win',
    template: '%s | FairWin',
  },
  description:
    'Provably fair on-chain raffles powered by Polygon and Chainlink VRF. Every draw is transparent, verifiable, and trustless.',
  keywords: [
    'raffle',
    'crypto',
    'polygon',
    'blockchain',
    'fairwin',
    'lottery',
    'chainlink',
    'vrf',
    'provably fair',
  ],
  openGraph: {
    title: 'FairWin — The Fairest Way to Win',
    description:
      'Provably fair on-chain raffles powered by Polygon. 100% transparent. 100% verifiable.',
    url: 'https://fairwin.io',
    siteName: 'FairWin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FairWin — The Fairest Way to Win',
    description:
      'Provably fair on-chain raffles powered by Polygon. 100% transparent.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-outfit min-h-screen bg-black text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
