'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';

interface Options<TData> {
  data: TData[] | undefined;
  columns: ColumnDef<TData, unknown>[];
  totalCount: number;
  pageSize: number;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (updater: VisibilityState) => void;
}

/**
 * TanStack Table in fully manual mode.
 *
 * The server already paginates, sorts and filters, so the table must not do any of
 * it again. Adding getFilteredRowModel or getPaginationRowModel here would make it
 * re-filter the 10 rows it was handed, and the visible count would then disagree
 * with `meta.total` from the API — a subtle bug that looks like a backend problem.
 *
 * `getCoreRowModel` and nothing else, on purpose.
 */
export function useServerTable<TData>({
  data,
  columns,
  totalCount,
  pageSize,
  columnVisibility,
  onColumnVisibilityChange,
}: Options<TData>) {
  // A new array identity every render would rebuild the whole table.
  const rows = useMemo(() => data ?? [], [data]);

  return useReactTable<TData>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),

    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,

    rowCount: totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),

    state: { ...(columnVisibility ? { columnVisibility } : {}) },
    onColumnVisibilityChange: onColumnVisibilityChange
      ? (updater) => {
          const next =
            typeof updater === 'function' ? updater(columnVisibility ?? {}) : updater;
          onColumnVisibilityChange(next);
        }
      : undefined,
  });
}
