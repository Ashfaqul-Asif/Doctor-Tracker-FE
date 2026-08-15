'use client';

import { memo } from 'react';
import { flexRender, type Row } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDataTable } from './DataTableProvider';
import { DataTableEmpty, DataTableError, DataTableSkeleton } from './DataTableStates';
import { DataTableMobileCards } from './DataTableMobileCards';

/**
 * Memoised so typing in the search box re-renders the input, not all 10 rows.
 * This only pays off because the row action handlers are wrapped in useCallback —
 * a fresh function identity each render would defeat it entirely.
 */
const MemoRow = memo(function DataTableRow<TData>({ row }: { row: Row<TData> }) {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(cell.column.columnDef.meta?.align === 'right' && 'text-right')}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}) as <TData>(props: { row: Row<TData> }) => React.JSX.Element;

interface DataTableProps {
  entity: string;
  error?: unknown;
  onRetry: () => void;
  /** Sorting is server-side, so the header reports it upward rather than sorting. */
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (key: string) => void;
}

export function DataTable({
  entity,
  error,
  onRetry,
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableProps) {
  const { table, isLoading, isFetching, hasActiveFilters, onClearFilters } = useDataTable();

  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleFlatColumns().length;

  return (
    <>
      {/*
        A 7-column table is unusable at 375px, so below `md` the same rows render as
        cards built from the SAME column definitions.

        Switched with CSS rather than a JS media-query hook. A JS switch has to guess
        during SSR, and guessing "mobile" made every desktop load flash the card
        layout before hydration corrected it — worse, anywhere hydration is deferred
        (a background tab) it stayed stuck on the wrong one. The duplicated markup is
        at most `limit` rows, which is a cheap price for being right on first paint.
      */}
      <div className="md:hidden">
        <DataTableMobileCards
          entity={entity}
          error={error}
          onRetry={onRetry}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
        />
      </div>

      <div
        className={cn(
          'hidden rounded-xl border bg-card transition-opacity md:block',
          // Refetching keeps the previous page visible (keepPreviousData) and just
          // dims it, instead of flashing a skeleton on every keystroke.
          isFetching && !isLoading && 'opacity-60',
        )}
      >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortKey = header.column.columnDef.meta?.sortKey;
                const isSorted = sortKey === sortBy;

                return (
                  <TableHead
                    key={header.id}
                    className={cn(header.column.columnDef.meta?.align === 'right' && 'text-right')}
                    aria-sort={
                      isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {header.isPlaceholder ? null : sortKey ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(sortKey)}
                        className="inline-flex items-center gap-1 rounded transition-colors hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {error ? (
            <DataTableError colSpan={columnCount} error={error} onRetry={onRetry} />
          ) : isLoading ? (
            <DataTableSkeleton cols={columnCount} />
          ) : rows.length === 0 ? (
            <DataTableEmpty
              colSpan={columnCount}
              entity={entity}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={onClearFilters}
            />
          ) : (
            rows.map((row) => <MemoRow key={row.id} row={row} />)
          )}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
