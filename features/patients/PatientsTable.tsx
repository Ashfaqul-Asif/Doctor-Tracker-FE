'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { DataTableProvider } from '@/components/data-table/DataTableProvider';
import { useServerTable } from '@/components/data-table/useServerTable';
import type { Patient } from '@/lib/api/types';
import { buildPatientColumns } from './columns';
import { PatientFormDialog } from './PatientFormDialog';
import { PatientsToolbar } from './PatientsToolbar';
import { usePatientFilters } from './usePatientFilters';
import { useDeletePatient, usePatients } from './hooks';

export function PatientsTable() {
  const filterApi = usePatientFilters();
  const { filters, params, update, clear, toggleSort, hasActiveFilters } = filterApi;

  const { data, isLoading, isFetching, error, refetch } = usePatients(params);
  const deletePatient = useDeletePatient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const handleEdit = useCallback((patient: Patient) => {
    setEditing(patient);
    setFormOpen(true);
  }, []);
  const handleDelete = useCallback((patient: Patient) => setToDelete(patient), []);

  const columns = useMemo(
    () => buildPatientColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  const table = useServerTable<Patient>({
    data: data?.items,
    columns,
    totalCount: data?.meta.total ?? 0,
    pageSize: filters.limit,
  });

  return (
    <>
      <PageHeader
        title="Patients"
        description="Every patient across all doctors."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add patient
          </Button>
        }
      />

      <DataTableProvider
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        totalCount={data?.meta.total ?? 0}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clear}
      >
        <PatientsToolbar {...filterApi} />

        <DataTable
          entity="patients"
          error={error}
          onRetry={() => void refetch()}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={toggleSort}
        />

        <DataTablePagination
          page={filters.page}
          limit={filters.limit}
          onPageChange={(page) => update({ page })}
          onLimitChange={(limit) => update({ limit, page: 1 })}
        />
      </DataTableProvider>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete patient?"
        description={
          <>
            <strong>{toDelete?.name}</strong> will be removed from the patients list and
            from {toDelete?.doctorName}&apos;s records.
          </>
        }
        confirmLabel="Delete"
        loading={deletePatient.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deletePatient.mutate(toDelete, { onSettled: () => setToDelete(null) });
        }}
      />
    </>
  );
}
