'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableSearch, type DataTableSearchHandle } from '@/components/data-table/DataTableSearch';
import { DataTableFacetFilter } from '@/components/data-table/DataTableFacetFilter';
import { DataTableDateFilter } from '@/components/data-table/DataTableDateFilter';
import { humanize } from '@/lib/utils/format';
import { GENDERS, type DatePreset } from '@/lib/api/types';
import { useDoctorOptions } from '../doctors/hooks';
import { usePatientFacets } from './hooks';
import type { usePatientFilters } from './usePatientFilters';

type FilterApi = ReturnType<typeof usePatientFilters>;

export function PatientsToolbar({ filters, update, clear, hasActiveFilters }: FilterApi) {
  const { data: facets } = usePatientFacets();
  const { data: doctors } = useDoctorOptions();
  const searchRef = useRef<DataTableSearchHandle>(null);

  return (
    <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center">
      <DataTableSearch
        ref={searchRef}
        value={filters.search}
        onChange={(search) => update({ search })}
        placeholder="Search name, condition, doctor…"
      />

      <div className="flex flex-wrap items-center gap-2">
        <DataTableFacetFilter
          title="Doctor"
          options={(doctors ?? []).map((d) => ({ label: d.name, value: d.id }))}
          selected={filters.doctorId}
          onChange={(doctorId) => update({ doctorId })}
        />

        {/* Explicitly required by spec §2.3. */}
        <DataTableFacetFilter
          title="Condition"
          options={(facets?.conditions ?? []).map((v) => ({ label: v, value: v }))}
          selected={filters.condition}
          onChange={(condition) => update({ condition })}
        />

        <DataTableFacetFilter
          title="Status"
          options={(facets?.statuses ?? []).map((s) => ({
            label: humanize(s.value),
            value: s.value,
            count: s.count,
          }))}
          selected={filters.status}
          onChange={(status) => update({ status })}
        />

        <DataTableFacetFilter
          title="Gender"
          options={GENDERS.map((g) => ({ label: humanize(g), value: g }))}
          // Single-valued on the API, so only the last pick is kept.
          selected={filters.gender ? [filters.gender] : []}
          onChange={(values) =>
            update({ gender: (values[values.length - 1] as typeof filters.gender) ?? null })
          }
        />

        <DataTableDateFilter
          datePreset={filters.datePreset as DatePreset | null}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          dateField={filters.dateField}
          dateFieldOptions={[
            { value: 'admittedAt', label: 'Admission date' },
            { value: 'createdAt', label: 'Date added' },
            { value: 'updatedAt', label: 'Last updated' },
          ]}
          onChange={(next) => update(next as Parameters<typeof update>[0])}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              clear();
              searchRef.current?.focus();
            }}
          >
            <X />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
