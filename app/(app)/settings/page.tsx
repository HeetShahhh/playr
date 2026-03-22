'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { RoleBadge } from '@/components/ui/RoleBadge';

export default function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState({
    matchAssigned: true,
    matchResult: true,
    tournament: true,
  });

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
  }, [profile]);

  const handleSaveName = async () => {
    if (!displayName.trim() || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id);
    if (!error) {
      await refreshProfile();
      showToast('Name updated!', 'success');
    } else {
      showToast('Failed to save. Try again.', 'error' as any);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    showToast('Contact support to delete your account.', 'action');
  };

  if (!profile) return null;

  return (
    <div className="p-4 max-w-lg fade-in space-y-6">
      <h1
        className="text-2xl font-bold text-navy pt-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Settings
      </h1>

      {/* My Account */}
      <section className="bg-white rounded-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <User size={14} className="text-muted" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              My Account
            </p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Display name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-chalk focus:outline-none focus:border-navy text-sm text-navy"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSaveName}
                disabled={saving || displayName === profile.display_name}
                className="px-4 py-2.5 bg-orange text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-orange/90"
                style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Avatar upload placeholder */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Avatar
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-chalk font-bold text-lg overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : profile.display_name.charAt(0).toUpperCase()
                }
              </div>
              <button
                className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-navy hover:border-navy/30 transition-colors"
                style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
                onClick={() => showToast('Photo upload coming soon!', 'action')}
              >
                Upload photo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* My Role */}
      <section className="bg-white rounded-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-muted" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              My Role
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <RoleBadge role={profile.role} />
            {profile.club_id && (
              <p className="text-xs text-muted mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                Member of a club
              </p>
            )}
          </div>
          <p className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
            Role assigned by admin
          </p>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-muted" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Notifications
            </p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: 'matchAssigned', label: 'Match assigned to me' },
            { key: 'matchResult', label: 'My match results' },
            { key: 'tournament', label: 'Tournament updates' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-navy" style={{ fontFamily: 'var(--font-body)' }}>
                {item.label}
              </span>
              <button
                onClick={() => setNotifs((n) => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                  notifs[item.key as keyof typeof notifs] ? 'bg-[#00A86B]' : 'bg-border'
                }`}
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label={item.label}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    notifs[item.key as keyof typeof notifs] ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Admin section */}
      {profile.role === 'club_admin' && (
        <section className="bg-white rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Club Settings
            </p>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Manage members', href: '/manage?tab=members' },
              { label: 'Assign roles', href: '/manage?tab=members' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-surface transition-colors"
                style={{ minHeight: '52px' }}
              >
                <span className="text-sm text-navy" style={{ fontFamily: 'var(--font-body)' }}>
                  {item.label}
                </span>
                <ChevronRight size={16} className="text-muted" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="bg-white rounded-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange" />
            <p className="text-xs font-semibold text-orange uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Danger Zone
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full py-3 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-surface transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '48px' }}
          >
            Sign out
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-3 text-sm font-semibold text-orange border border-orange/30 rounded-lg hover:bg-orange/5 transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '48px' }}
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}
