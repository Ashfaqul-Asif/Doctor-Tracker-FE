'use client';

import { useCallback, useDebugValue, useMemo, useTransition } from 'react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { DATE_PRESETS, GENDERS, PATIENT_SORT_KEYS, type PatientListParams } from '@/lib/api/types';

/** Same URL-as-state approach as useDoctorFilters; param names match the API. */
export function usePatientFilters() {
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      doctorId: parseAsArrayOf(parseAsString).withDefault([]),
      condition: parseAsArrayOf(parseAsString).withDefault([]),
      status: parseAsArrayOf(parseAsString).withDefault([]),
      gender: parseAsStringLiteral(GENDERS),
      ageMin: parseAsInteger,
      ageMax: parseAsInteger,
      datePreset: parseAsStringLiteral(DATE_PRESETS),
      dateFrom: parseAsString,
      dateTo: parseAsString,
      // "date-wise" is ambiguous — admission date and record-entry date answer
      // different questions, so the caller picks. Defaults to admission.
      dateField: parseAsStringLiteral(['admittedAt', 'createdAt', 'updatedAt'] as const).withDefault(
        'admittedAt',
      ),
      sortBy: parseAsStringLiteral(PATIENT_SORT_KEYS).withDefault('createdAt'),
      sortOrder: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
    },
    { history: 'replace', shallow: true, startTransition },
  );

  type Filters = typeof filters;

  const update = useCallback(
    (patch: Partial<Filters>) => {
      // Any filter change returns to page 1, or you land on an empty page 5.
      const resetsPage = Object.keys(patch).some((k) => k !== 'page' && k !== 'limit');
      void setFilters({ ...patch, ...(resetsPage ? { page: 1 } : {}) });
    },
    [setFilters],
  );

  const clear = useCallback(() => {
    void setFilters({
      search: '',
      doctorId: [],
      condition: [],
      status: [],
      gender: null,
      ageMin: null,
      ageMax: null,
      datePreset: null,
      dateFrom: null,
      dateTo: null,
      page: 1,
    });
  }, [setFilters]);

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
    filters.doctorId.length > 0 ||
    filters.condition.length > 0 ||
    filters.status.length > 0 ||
    filters.gender !== null ||
    filters.ageMin !== null ||
    filters.ageMax !== null ||
    filters.datePreset !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  const params = useMemo<PatientListParams>(
    () => ({
      search: filters.search || undefined,
      doctorId: filters.doctorId.length ? filters.doctorId : undefined,
      condition: filters.condition.length ? filters.condition : undefined,
      status: filters.status.length ? filters.status : undefined,
      gender: filters.gender ?? undefined,
      ageMin: filters.ageMin ?? undefined,
      ageMax: filters.ageMax ?? undefined,
      datePreset: filters.datePreset ?? undefined,
      dateFrom: filters.dateFrom ?? undefined,
      dateTo: filters.dateTo ?? undefined,
      dateField: filters.dateField,
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
