'use client';

/**
 * useRole — lightweight helper that returns the current user's role
 * and convenient boolean flags.
 */
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export function useRole() {
  const { profile } = useAuth();
  const role: UserRole = profile?.role ?? 'player';

  return {
    role,
    isPlayer:    role === 'player',
    isUmpire:    role === 'umpire',
    isClubAdmin: role === 'club_admin',
    isSpectator: role === 'spectator',
    /** Can access the live scoring screen */
    canScore:    role === 'umpire' || role === 'club_admin',
    /** Can access club management screens */
    canManage:   role === 'club_admin',
  };
}
