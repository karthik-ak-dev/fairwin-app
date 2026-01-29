import { type ReactNode } from 'react';
import Sidebar from '@/features/admin/components/Sidebar';

export const metadata = {
  title: 'FairWin Admin',
  description: 'FairWin operator administration panel',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      <main className="ml-[240px] p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
