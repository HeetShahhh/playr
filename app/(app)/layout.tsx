'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/nav/BottomNav';
import { SidebarNav } from '@/components/nav/SidebarNav';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-chalk flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-navy border-t-orange rounded-full animate-spin" />
          <p className="text-sm text-muted" style={{ fontFamily: 'var(--font-body)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-chalk">
      <SidebarNav />
      <main className="lg:ml-60 pb-20 lg:pb-0 fade-in">
        <div className="max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
