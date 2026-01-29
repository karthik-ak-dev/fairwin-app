'use client';

import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import RaffleDetail from '@/features/raffle/components/RaffleDetail';
import { use } from 'react';

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto px-8">
          <RaffleDetail raffleId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
