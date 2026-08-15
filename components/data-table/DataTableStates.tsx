'use client';

import { AlertCircle, FileQuestion, RotateCw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

export function DataTableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4" style={{ width: `${55 + ((r + c) % 4) * 12}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface EmptyProps {
  colSpan: number;
  /** Drives the message: no records at all vs no matches for the current filters. */
  hasActiveFilters: boolean;
  entity: string;
  onClearFilters: () => void;
}

export function DataTableEmpty({ colSpan, hasActiveFilters, entity, onClearFilters }: EmptyProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="h-56">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {hasActiveFilters ? (
            <>
              <SearchX className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No {entity} match these filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search term or clear the filters.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No {entity} yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Records you add will appear here.
                </p>
              </div>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DataTableError({
  colSpan,
  error,
  onRetry,
}: {
  colSpan: number;
  error: unknown;
  onRetry: () => void;
}) {
  const message = error instanceof Error ? error.message : 'Something went wrong';

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="h-56">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Could not load this list</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw />
            Try again
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
