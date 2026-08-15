'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { doctorsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query/keys';
import type {
  Doctor,
  DoctorInput,
  DoctorListParams,
  PatientInput,
  PatientListParams,
} from '@/lib/api/types';

/**
 * Every doctor-related read and write. Components call these directly at any depth —
 * data is never handed down as a prop.
 */

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: qk.doctors.list(params),
    queryFn: () => doctorsApi.list(params),
    // Keeps the previous page on screen while the next loads, so paging and typing
    // never collapse the table into a skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useDoctorFacets() {
  return useQuery({
    queryKey: qk.doctors.facets(),
    queryFn: doctorsApi.facets,
    // Matches the server's own 60s cache on this endpoint.
    staleTime: 60_000,
  });
}

export function useDoctorOptions() {
  return useQuery({
    queryKey: qk.doctors.options(),
    queryFn: doctorsApi.options,
    staleTime: 60_000,
  });
}

/** Patients belonging to one doctor — spec §2.2. */
export function useDoctorPatients(doctorId: string | null, params: PatientListParams) {
  return useQuery({
    queryKey: qk.doctors.patients(doctorId ?? '', params),
    queryFn: () => doctorsApi.patients(doctorId!, params),
    enabled: Boolean(doctorId),
    placeholderData: keepPreviousData,
  });
}

/**
 * A create or delete changes the dashboard totals as well as the list, so both are
 * invalidated. A stale dashboard beside a fresh table reads as a bug.
 */
function useInvalidateDoctorData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.doctors.all });
    void queryClient.invalidateQueries({ queryKey: qk.patients.all });
    void queryClient.invalidateQueries({ queryKey: qk.analytics.all });
  };
}

export function useCreateDoctor() {
  const invalidate = useInvalidateDoctorData();

  return useMutation({
    mutationFn: (input: DoctorInput) => doctorsApi.create(input),
    onSuccess: (doctor) => {
      invalidate();
      toast.success(`${doctor.name} added`);
    },
  });
}

export function useUpdateDoctor() {
  const invalidate = useInvalidateDoctorData();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DoctorInput> }) =>
      doctorsApi.update(id, input),
    onSuccess: (doctor) => {
      invalidate();
      toast.success(`${doctor.name} updated`);
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDoctorData();

  return useMutation({
    mutationFn: (doctor: Doctor) => doctorsApi.remove(doctor.id),

    // Optimistic removal via the query cache, not useOptimistic: the row lives in
    // the cache, and running two optimistic systems over the same data causes
    // flicker and lost rollbacks.
    onMutate: async (doctor) => {
      await queryClient.cancelQueries({ queryKey: qk.doctors.all });
      const snapshot = queryClient.getQueriesData({ queryKey: qk.doctors.all });

      queryClient.setQueriesData<{ items: Doctor[]; meta: { total: number } }>(
        { queryKey: qk.doctors.all },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((d) => d.id !== doctor.id),
                meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
              }
            : old,
      );

      return { snapshot };
    },

    onError: (_err, _doctor, context) => {
      // Put every touched cache entry back exactly as it was.
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Could not remove the doctor');
    },

    onSuccess: (result, doctor) => {
      toast.success(
        result.cascadedPatients > 0
          ? `${doctor.name} and ${result.cascadedPatients} patient${result.cascadedPatients === 1 ? '' : 's'} removed`
          : `${doctor.name} removed`,
      );
    },

    onSettled: invalidate,
  });
}

/** Spec §2.2 — "add new patients under a specific doctor". */
export function useAddPatientToDoctor(doctorId: string | null) {
  const invalidate = useInvalidateDoctorData();

  return useMutation({
    mutationFn: (input: PatientInput) => doctorsApi.addPatient(doctorId!, input),
    onSuccess: (patient) => {
      invalidate();
      toast.success(`${patient.name} added`);
    },
  });
}
