'use client';

import { useCallback, useMemo, useState } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PatientStatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { formatDate } from '@/lib/utils/format';
import type { Doctor, Patient, PatientListParams } from '@/lib/api/types';
import { useDoctorPatients } from './hooks';
import { useDeletePatient } from '../patients/hooks';
import { PatientFormDialog } from '../patients/PatientFormDialog';

interface Props {
  /** The doctor whose patients are shown; null closes the drawer. */
  doctor: Doctor | null;
  onClose: () => void;
}

/**
 * Spec §2.2: "view corresponding patients for each doctor", "add new patients under
 * a specific doctor", and "delete patients from the doctor's patient list".
 *
 * A drawer rather than a page, because §4 fixes navigation to exactly three
 * destinations. Its open state lives in the URL (`?doctorPatients=<id>`), so the view
 * is still deep-linkable and the back button closes it.
 */
export function DoctorPatientsDrawer({ doctor, onClose }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const deletePatient = useDeletePatient();

  const params = useMemo<PatientListParams>(
    () => ({
      search: debouncedSearch || undefined,
      page,
      limit: 10,
      sortBy: 'admittedAt',
      sortOrder: 'desc',
    }),
    [debouncedSearch, page],
  );

  const { data, isLoading, isError, refetch } = useDoctorPatients(doctor?.id ?? null, params);

  const handleClose = useCallback(() => {
    setSearch('');
    setPage(1);
    onClose();
  }, [onClose]);

  const patients = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <>
      <Sheet open={Boolean(doctor)} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>{doctor?.name ?? 'Patients'}</SheetTitle>
            <SheetDescription>
              {doctor?.specialization} · {doctor?.hospital}
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 border-b p-4">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search this doctor's patients…"
              className="h-9"
              type="search"
            />
            <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
              <Plus />
              Add
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="space-y-2 p-4">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Could not load patients.</p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Try again
                </Button>
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <UserRound className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {search ? 'No matching patients' : 'No patients yet'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {search
                      ? 'Try a different search term.'
                      : `Patients assigned to ${doctor?.name ?? 'this doctor'} will appear here.`}
                  </p>
                </div>
                {!search && (
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus />
                    Add patient
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {patients.map((patient) => (
                  <li key={patient.id}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{patient.name}</p>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {patient.condition}
                            {patient.age !== undefined && ` · ${patient.age}y`}
                            {patient.gender && ` · ${patient.gender}`}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Admitted {formatDate(patient.admittedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <PatientStatusBadge status={patient.status} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setToDelete(patient)}
                            aria-label={`Remove ${patient.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <span className="text-muted-foreground">
                {total} patient{total === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Doctor is pinned from the URL, so the form hides its doctor picker. */}
      <PatientFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        pinnedDoctor={doctor ?? undefined}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove patient?"
        description={
          <>
            <strong>{toDelete?.name}</strong> will be removed from{' '}
            {doctor?.name ?? 'this doctor'}&apos;s list and from the patients page.
          </>
        }
        confirmLabel="Remove"
        loading={deletePatient.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deletePatient.mutate(toDelete, { onSettled: () => setToDelete(null) });
        }}
      />
    </>
  );
}

/**
 * Keeps the drawer's open state in the URL so it survives a refresh and can be
 * shared, without becoming a route of its own.
 */
export function useDoctorPatientsParam() {
  const [{ doctorPatients }, set] = useQueryStates(
    { doctorPatients: parseAsString, drawerPage: parseAsInteger },
    { history: 'push', shallow: true },
  );

  const open = useCallback((id: string) => void set({ doctorPatients: id }), [set]);
  const close = useCallback(() => void set({ doctorPatients: null }), [set]);

  return { openDoctorId: doctorPatients, open, close };
}
