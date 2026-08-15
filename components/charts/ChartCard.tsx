'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps every chart with a FIXED-HEIGHT region.
 *
 * Recharts' ResponsiveContainer measures its parent; inside a grid or flex parent
 * with no explicit height that measurement is zero and the chart silently renders
 * nothing. The h-[300px] here is what prevents that.
 */
export function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = 'No data for this period',
  className,
  children,
}: Props) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
