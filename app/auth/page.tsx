'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AuthStep = 'signin' | 'signup' | 'otp';

function Logomark() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold select-none"
      style={{ backgroundColor: '#0D1B2A', fontSize: 14, fontFamily: 'var(--font-display)' }}>
      P▶
    </div>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();

  const [step, setStep] = useState<AuthStep>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (profile) {
      router.push(profile.onboarded ? '/dashboard' : '/onboarding');
    }
  }, [user, profile, loading, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: step === 'signup' },
    });
    if (error) setError(error.message);
    else setStep('otp');
    setBusy(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setBusy(true);
    setError('');
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });
    if (error) { setError(error.message); setBusy(false); return; }
    if (data.user) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('onboarded')
        .eq('id', data.user.id)
        .single();
      router.push(profileData?.onboarded ? '/dashboard' : '/onboarding');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="px-4 py-4 flex items-center justify-between">
        <button onClick={() => step === 'otp' ? setStep('signin') : router.push('/')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-navy min-h-[44px] px-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <Logomark />
          <span className="font-bold text-navy" style={{ fontFamily: 'var(--font-display)' }}>Playr</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm fade-in">

          {(step === 'signin' || step === 'signup') && (
            <div>
              <h1 className="text-2xl font-bold text-navy mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {step === 'signup' ? 'Join Playr' : 'Welcome back'}
              </h1>
              <p className="text-muted text-sm mb-8">
                {step === 'signup' ? 'Start scoring matches in under 2 minutes.' : 'Sign in to see your matches and stats.'}
              </p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white text-navy placeholder:text-muted focus:outline-none focus:border-navy text-base"
                    style={{ minHeight: '48px' }} />
                </div>
                {error && <p className="text-sm text-orange">{error}</p>}
                <button type="submit" disabled={busy || !email}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}>
                  {busy
                    ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <>Continue with email <ArrowRight size={16} /></>}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => setStep(step === 'signin' ? 'signup' : 'signin')}
                  className="text-sm text-muted hover:text-navy transition-colors">
                  {step === 'signin' ? "Don't have an account? Sign up free" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <h1 className="text-2xl font-bold text-navy mb-1" style={{ fontFamily: 'var(--font-display)' }}>Check your email</h1>
              <p className="text-muted text-sm mb-1">We sent a 6-digit code to</p>
              <p className="font-semibold text-navy text-sm mb-8">{email}</p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input type="text" inputMode="numeric"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6} required autoFocus
                  className="w-full px-4 py-4 rounded-lg border border-border bg-white text-navy placeholder:text-muted/40 focus:outline-none focus:border-navy text-3xl text-center tracking-[0.5em]"
                  style={{ fontFamily: 'var(--font-mono)', minHeight: '72px' }} />
                {error && <p className="text-sm text-orange">{error}</p>}
                <button type="submit" disabled={busy || otp.length < 6}
                  className="w-full flex items-center justify-center py-3.5 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}>
                  {busy ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Verify code'}
                </button>
                <button type="button" onClick={() => setStep('signin')} className="w-full text-center text-sm text-muted hover:text-navy">
                  Use a different email
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-chalk" />}>
      <AuthPageInner />
    </Suspense>
  );
}
