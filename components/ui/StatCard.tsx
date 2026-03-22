import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, sub, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-card border border-border p-4', className)}>
      <p
        className="text-xs text-muted uppercase tracking-wider mb-1"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-bold text-navy"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium mb-0.5',
              trend === 'up' ? 'text-[#00A86B]' : trend === 'down' ? 'text-orange' : 'text-muted'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-xs text-muted mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
