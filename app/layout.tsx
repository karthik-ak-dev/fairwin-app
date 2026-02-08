import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from './providers/SessionProvider';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'MassiveHikeCoin - Stake & Earn 8% Monthly',
  description: 'Simple USDT staking with guaranteed 8% monthly returns for 24 months. Plus earn up to 15% commission from 5-level referrals on Binance Smart Chain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" theme="dark" richColors />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
