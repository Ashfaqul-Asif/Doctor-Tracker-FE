'use client';

import { flexRender } from '@tanstack/react-table';
import { AlertCircle, FileQuestion, RotateCw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataTable } from './DataTableProvider';

interface Props {
  entity: string;
  error?: unknown;
  onRetry: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * The mobile view of the same data.
 *
 * Built from the *same* column definitions as the desktop table — the card layout
 * reads `meta.primary`, `meta.mobileLabel` and `meta.hideOnMobile` rather than
 * defining its own field list, so adding a column cannot leave mobile behind.
 */
export function DataTableMobileCards({
  entity,
  error,
  onRetry,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  const { table, isLoading, isFetching } = useDataTable();
  const rows = table.getRowModel().rows;

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Could not load this list</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw />
          Try again
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        {hasActiveFilters ? (
          <>
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No {entity} match these filters</p>
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          </>
        ) : (
          <>
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No {entity} yet</p>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className={isFetching ? 'space-y-3 opacity-60 transition-opacity' : 'space-y-3'}>
      {rows.map((row) => {
        const cells = row.getVisibleCells();
        const primary = cells.find((c) => c.column.columnDef.meta?.primary);
        const actions = cells.find((c) => c.column.id === 'actions');
        const rest = cells.filter(
          (c) =>
            !c.column.columnDef.meta?.primary &&
            !c.column.columnDef.meta?.hideOnMobile &&
            c.column.id !== 'actions',
        );

        return (
          <Card key={row.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 font-medium">
                {primary && flexRender(primary.column.columnDef.cell, primary.getContext())}
              </div>
              {actions && (
                <div className="shrink-0">
                  {flexRender(actions.column.columnDef.cell, actions.getContext())}
                </div>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {rest.map((cell) => {
                const meta = cell.column.columnDef.meta;
                const label =
                  meta?.mobileLabel ??
                  (typeof cell.column.columnDef.header === 'string'
                    ? cell.column.columnDef.header
                    : cell.column.id);

                return (
                  <div key={cell.id} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
