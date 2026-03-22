import { redirect } from 'next/navigation';

/** Dashboard removed in v2 — everything lives at /  */
export default function DashboardPage() {
  redirect('/');
}
