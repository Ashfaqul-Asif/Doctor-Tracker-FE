'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableSearch, type DataTableSearchHandle } from '@/components/data-table/DataTableSearch';
import { DataTableFacetFilter } from '@/components/data-table/DataTableFacetFilter';
import { DataTableDateFilter } from '@/components/data-table/DataTableDateFilter';
import { humanize } from '@/lib/utils/format';
import type { DatePreset } from '@/lib/api/types';
import { useDoctorFacets } from './hooks';
import type { useDoctorFilters } from './useDoctorFilters';

type FilterApi = ReturnType<typeof useDoctorFilters>;

/**
 * Reads filters from the URL hook rather than receiving them as props, so the page
 * does not have to thread eleven values plus setters through the tree.
 */
export function DoctorsToolbar({ filters, update, clear, hasActiveFilters }: FilterApi) {
  const { data: facets } = useDoctorFacets();
  const searchRef = useRef<DataTableSearchHandle>(null);

  return (
    <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center">
      <DataTableSearch
        ref={searchRef}
        value={filters.search}
        onChange={(search) => update({ search })}
        placeholder="Search name, specialization, hospital…"
      />

      <div className="flex flex-wrap items-center gap-2">
        <DataTableFacetFilter
          title="Specialization"
          options={(facets?.specializations ?? []).map((v) => ({ label: v, value: v }))}
          selected={filters.specialization}
          onChange={(specialization) => update({ specialization })}
        />

        <DataTableFacetFilter
          title="Hospital"
          options={(facets?.hospitals ?? []).map((v) => ({ label: v, value: v }))}
          selected={filters.hospital}
          onChange={(hospital) => update({ hospital })}
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

        <DataTableDateFilter
          datePreset={filters.datePreset as DatePreset | null}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          dateField={filters.dateField}
          dateFieldOptions={[
            { value: 'createdAt', label: 'Date added' },
            { value: 'updatedAt', label: 'Last updated' },
          ]}
          onChange={(next) => update(next as Parameters<typeof update>[0])}
        />

        {/* Answers "who is overloaded?" and "who has no patients yet?" — the reason
            patientCount is denormalised on the server. */}
        <Button
          variant={filters.hasPatients === 'false' ? 'default' : 'outline'}
          size="sm"
          className="h-9 border-dashed"
          onClick={() =>
            update({ hasPatients: filters.hasPatients === 'false' ? null : 'false' })
          }
        >
          No patients
        </Button>

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
