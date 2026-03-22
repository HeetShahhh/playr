'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, User, Settings, BarChart2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { RoleBadge } from '@/components/ui/RoleBadge';

export function SidebarNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const role = profile?.role || 'player';

  const profileHref = profile?.username ? `/p/${profile.username}` : '/profile';

  const items = [
    { href: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { href: '/matches', icon: <BarChart2 size={20} />, label: 'Matches' },
    ...(role === 'umpire' || role === 'club_admin'
      ? [{ href: '/score', icon: <Zap size={20} />, label: 'Score' }]
      : []),
    { href: profileHref, icon: <User size={20} />, label: 'My Profile' },
    ...(role === 'club_admin'
      ? [{ href: '/manage', icon: <Shield size={20} />, label: 'Manage Club' }]
      : []),
    { href: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
            style={{ backgroundColor: '#0D1B2A', color: '#B6F000' }}
          >
            P▶
          </div>
          <span
            className="text-lg font-bold text-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Playr
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-navy text-chalk'
                  : 'text-muted hover:bg-surface hover:text-navy'
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item.icon}
              {item.label}
              {isActive && item.href === '/score' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-orange pulse-dot" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      {profile && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-sm font-bold text-navy overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-navy truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile.display_name}
              </p>
              <RoleBadge role={profile.role} className="mt-0.5 text-[10px] px-1.5 py-0.5" />
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-left text-xs text-muted hover:text-orange transition-colors py-1"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
