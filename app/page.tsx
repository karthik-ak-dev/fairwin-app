'use client';

import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import {
  Hero,
  GamesGrid,
  LiveDraws,
  RealtimeWins,
  VerifySection,
  DifferenceSection,
  FAQ,
  CTASection,
} from '@/features/home';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <Hero />
      <GamesGrid />
      <LiveDraws />
      <RealtimeWins />
      <VerifySection />
      <DifferenceSection />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
