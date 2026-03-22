'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileRedirect() {
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      router.replace(`/profile/${profile.id}`);
    }
  }, [profile, router]);

  return null;
}
