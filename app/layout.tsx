import type { Metadata } from 'next';
import './styles/globals.css';
import QueryProvider from './providers/QueryProvider';

export const metadata: Metadata = {
  title: 'FairWin - 100% On-Chain Gaming',
  description: 'Every bet, every outcome, every payout on the blockchain. Verify it yourself on Polygonscan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
