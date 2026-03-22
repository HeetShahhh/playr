import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  player: { label: 'Player', className: 'bg-navy/10 text-navy' },
  umpire: { label: 'Umpire', className: 'bg-[#E8A020]/15 text-[#B87800]' },
  club_admin: { label: 'Admin', className: 'bg-orange/15 text-orange' },
  spectator: { label: 'Spectator', className: 'bg-muted/15 text-muted' },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.spectator;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium',
        config.className,
        className
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {config.label}
    </span>
  );
}
