'use client';

import { useCallback, useDebugValue, useMemo, useTransition } from 'react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { DATE_PRESETS, DOCTOR_SORT_KEYS, type DoctorListParams } from '@/lib/api/types';

/**
 * Doctor filters live in the URL, not in React state.
 *
 * That buys four things at once: the view is shareable and bookmarkable, the back
 * button steps through filter history, resetting is just clearing params — and,
 * most relevant to the architecture, no filter state has to be threaded down the
 * component tree. Any component calls this hook directly.
 *
 * Param names match the server's listDoctorsSchema exactly, so this object
 * serialises straight into the query string.
 */
export function useDoctorFilters() {
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      specialization: parseAsArrayOf(parseAsString).withDefault([]),
      hospital: parseAsArrayOf(parseAsString).withDefault([]),
      status: parseAsArrayOf(parseAsString).withDefault([]),
      datePreset: parseAsStringLiteral(DATE_PRESETS),
      dateFrom: parseAsString,
      dateTo: parseAsString,
      dateField: parseAsStringLiteral(['createdAt', 'updatedAt'] as const).withDefault('createdAt'),
      hasPatients: parseAsStringLiteral(['true', 'false'] as const),
      sortBy: parseAsStringLiteral(DOCTOR_SORT_KEYS).withDefault('createdAt'),
      sortOrder: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
    },
    {
      history: 'replace',
      // shallow keeps the update client-side; startTransition marks it non-urgent so
      // typing stays responsive while the table re-renders.
      shallow: true,
      startTransition,
    },
  );

  type Filters = typeof filters;

  /**
   * Any filter change resets to page 1. Without this you can be on page 5, narrow
   * the results to a single page, and land on an empty table that looks broken.
   */
  const update = useCallback(
    (patch: Partial<Filters>) => {
      const resetsPage = Object.keys(patch).some((k) => k !== 'page' && k !== 'limit');
      void setFilters({ ...patch, ...(resetsPage ? { page: 1 } : {}) });
    },
    [setFilters],
  );

  const clear = useCallback(() => {
    void setFilters({
      search: '',
      specialization: [],
      hospital: [],
      status: [],
      datePreset: null,
      dateFrom: null,
      dateTo: null,
      hasPatients: null,
      page: 1,
    });
  }, [setFilters]);

  /** Sorting the same column again flips direction; a new column starts descending. */
  const toggleSort = useCallback(
    (key: string) => {
      const sortBy = key as Filters['sortBy'];
      void setFilters({
        sortBy,
        sortOrder: filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc',
        page: 1,
      });
    },
    [filters.sortBy, filters.sortOrder, setFilters],
  );

  const hasActiveFilters =
    filters.search !== '' ||
    filters.specialization.length > 0 ||
    filters.hospital.length > 0 ||
    filters.status.length > 0 ||
    filters.datePreset !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.hasPatients !== null;

  /** Shaped for the API and used as the query key, so it must be stable. */
  const params = useMemo<DoctorListParams>(
    () => ({
      search: filters.search || undefined,
      specialization: filters.specialization.length ? filters.specialization : undefined,
      hospital: filters.hospital.length ? filters.hospital : undefined,
      status: filters.status.length ? filters.status : undefined,
      datePreset: filters.datePreset ?? undefined,
      dateFrom: filters.dateFrom ?? undefined,
      dateTo: filters.dateTo ?? undefined,
      dateField: filters.dateField,
      hasPatients: filters.hasPatients ?? undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  );

  useDebugValue(hasActiveFilters ? 'filtered' : 'unfiltered');

  return { filters, params, update, clear, toggleSort, hasActiveFilters, isPending };
}
