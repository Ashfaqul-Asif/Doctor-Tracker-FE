'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Table } from '@tanstack/react-table';

/**
 * Shares the table instance with the toolbar, pagination, and column menu.
 *
 * This is the direct answer to prop drilling for tables: without it, every one of
 * those components would need the instance threaded down from the page. They read
 * it from context instead, so the page composes them freely at any depth.
 */
interface DataTableContextValue<TData> {
  table: Table<TData>;
  isLoading: boolean;
  isFetching: boolean;
  totalCount: number;
  /** True when any filter is applied — distinguishes "no data" from "no matches". */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTableContext = createContext<DataTableContextValue<any> | null>(null);

interface DataTableProviderProps<TData> extends DataTableContextValue<TData> {
  children: React.ReactNode;
}

export function DataTableProvider<TData>({
  children,
  table,
  isLoading,
  isFetching,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: DataTableProviderProps<TData>) {
  const value = useMemo(
    () => ({ table, isLoading, isFetching, totalCount, hasActiveFilters, onClearFilters }),
    [table, isLoading, isFetching, totalCount, hasActiveFilters, onClearFilters],
  );

  return <DataTableContext.Provider value={value}>{children}</DataTableContext.Provider>;
}

export function useDataTable<TData>(): DataTableContextValue<TData> {
  const ctx = useContext(DataTableContext);
  if (!ctx) throw new Error('useDataTable must be used inside <DataTableProvider>');
  return ctx as DataTableContextValue<TData>;
}
