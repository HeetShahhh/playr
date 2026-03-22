/**
 * (app) route group layout — v2
 * Auth wall removed. Scoring is guest-first. Just render children.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
