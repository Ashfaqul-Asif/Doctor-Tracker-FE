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
import type { Doctor } from '@/lib/api/types';
import { buildDoctorColumns } from './columns';
import { DoctorFormDialog } from './DoctorFormDialog';
import { DoctorPatientsDrawer, useDoctorPatientsParam } from './DoctorPatientsDrawer';
import { DoctorsToolbar } from './DoctorsToolbar';
import { useDoctorFilters } from './useDoctorFilters';
import { useDeleteDoctor, useDoctors } from './hooks';

export function DoctorsTable() {
  const filterApi = useDoctorFilters();
  const { filters, params, update, clear, toggleSort, hasActiveFilters } = filterApi;

  const { data, isLoading, isFetching, error, refetch } = useDoctors(params);
  const deleteDoctor = useDeleteDoctor();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);

  const { openDoctorId, open: openDrawer, close: closeDrawer } = useDoctorPatientsParam();

  /**
   * Stable identities so the memoised rows actually stay memoised — without
   * useCallback here, every render produces new handlers, new column defs, and the
   * React.memo on the row is defeated.
   */
  const handleViewPatients = useCallback((doctor: Doctor) => openDrawer(doctor.id), [openDrawer]);
  const handleEdit = useCallback((doctor: Doctor) => {
    setEditing(doctor);
    setFormOpen(true);
  }, []);
  const handleDelete = useCallback((doctor: Doctor) => setToDelete(doctor), []);

  const columns = useMemo(
    () =>
      buildDoctorColumns({
        onViewPatients: handleViewPatients,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleViewPatients, handleEdit, handleDelete],
  );

  const table = useServerTable<Doctor>({
    data: data?.items,
    columns,
    totalCount: data?.meta.total ?? 0,
    pageSize: filters.limit,
  });

  // The drawer needs the full record; it is already in the current page of results.
  const drawerDoctor = useMemo(
    () => data?.items.find((d) => d.id === openDoctorId) ?? null,
    [data?.items, openDoctorId],
  );

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage the doctor directory and their patients."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add doctor
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
        <DoctorsToolbar {...filterApi} />

        <DataTable
          entity="doctors"
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

      <DoctorFormDialog open={formOpen} onOpenChange={setFormOpen} doctor={editing} />

      <DoctorPatientsDrawer doctor={drawerDoctor} onClose={closeDrawer} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete doctor?"
        description={
          <>
            <strong>{toDelete?.name}</strong> will be removed.
            {(toDelete?.patientCount ?? 0) > 0 && (
              <>
                {' '}
                Their <strong>{toDelete?.patientCount}</strong> patient
                {toDelete?.patientCount === 1 ? '' : 's'} will be removed as well.
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        loading={deleteDoctor.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteDoctor.mutate(toDelete, { onSettled: () => setToDelete(null) });
        }}
      />
    </>
  );
}
