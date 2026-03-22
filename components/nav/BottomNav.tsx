'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, User, Settings, BarChart2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const role = profile?.role || 'player';

  const profileHref = profile?.username ? `/p/${profile.username}` : '/profile';

  const items: NavItem[] = [
    { href: '/dashboard', icon: <Home size={22} />, label: 'Home' },
    { href: '/matches', icon: <BarChart2 size={22} />, label: 'Matches' },
    ...(role === 'umpire' || role === 'club_admin'
      ? [{ href: '/score', icon: <Zap size={22} />, label: 'Score' }]
      : []),
    { href: profileHref, icon: <User size={22} />, label: 'Profile' },
    ...(role === 'club_admin'
      ? [{ href: '/manage', icon: <Shield size={22} />, label: 'Manage' }]
      : []),
    { href: '/settings', icon: <Settings size={22} />, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border bottom-nav lg:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 min-h-[56px] flex-1 transition-colors',
                isActive ? 'text-orange' : 'text-muted hover:text-navy'
              )}
            >
              <span className={cn('transition-transform', isActive && 'scale-110')}>
                {item.icon}
              </span>
              <span
                className="text-[10px] mt-0.5 font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
