import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils/format';

interface Props {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  /** Averages need decimals; counts do not. */
  decimals?: boolean;
}

export function StatCard({ label, value, hint, icon: Icon, isLoading, decimals }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">
              {decimals ? value.toFixed(1) : formatNumber(value)}
            </p>
          )}
          {hint && !isLoading && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
