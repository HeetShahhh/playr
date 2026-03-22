import { redirect } from 'next/navigation';

/** Onboarding removed in v2 */
export default function OnboardingPage() {
  redirect('/');
}
