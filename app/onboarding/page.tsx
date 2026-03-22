'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StepDots }       from './components/StepDots';
import { Step1Promise }   from './components/Step1Promise';
import { Step2Identity }  from './components/Step2Identity';
import { Step3Community } from './components/Step3Community';
import { Step4SportSelect } from './components/Step4SportSelect';

// Step backgrounds
const BG = ['#0D1B2A', '#F5F5F0', '#0D1B2A', '#F5F5F0'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedSport, setSelectedSport] = useState('');
  const [saving, setSaving] = useState(false);

  // Guard: already onboarded → dashboard
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (profile?.onboarded) { router.push('/dashboard'); }
  }, [user, profile, loading, router]);

  const next = () => setStep(s => Math.min(s + 1, 3));

  const handleComplete = async () => {
    if (!user || !selectedSport) return;
    setSaving(true);
    await supabase
      .from('user_profiles')
      .update({ primary_sport: selectedSport, onboarded: true })
      .eq('id', user.id);
    await refreshProfile();
    router.push('/dashboard');
    setSaving(false);
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-navy" />;
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{ backgroundColor: BG[step] }}
    >
      {/* Progress dots */}
      <div className="flex justify-center pt-8 pb-4">
        <StepDots total={4} current={step} />
      </div>

      {/* Steps */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {step === 0 && <Step1Promise   onNext={next} />}
        {step === 1 && <Step2Identity  onNext={next} />}
        {step === 2 && <Step3Community onNext={next} />}
        {step === 3 && (
          <Step4SportSelect
            selected={selectedSport}
            onSelect={setSelectedSport}
            onComplete={handleComplete}
            loading={saving}
          />
        )}
      </div>
    </div>
  );
}
