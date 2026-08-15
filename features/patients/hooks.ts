'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { patientsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query/keys';
import type { Patient, PatientInput, PatientListParams } from '@/lib/api/types';

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: qk.patients.list(params),
    queryFn: () => patientsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatientFacets() {
  return useQuery({
    queryKey: qk.patients.facets(),
    queryFn: patientsApi.facets,
    staleTime: 60_000,
  });
}

/**
 * A patient write moves a doctor's patientCount and shifts the dashboard totals, so
 * all three caches are invalidated together.
 */
function useInvalidatePatientData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.patients.all });
    void queryClient.invalidateQueries({ queryKey: qk.doctors.all });
    void queryClient.invalidateQueries({ queryKey: qk.analytics.all });
  };
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (input: PatientInput) => patientsApi.create(input),
    onSuccess: (patient) => {
      invalidate();
      toast.success(`${patient.name} added`);
    },
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PatientInput> }) =>
      patientsApi.update(id, input),
    onSuccess: (patient) => {
      invalidate();
      toast.success(`${patient.name} updated`);
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePatientData();

  return useMutation({
    mutationFn: (patient: Patient) => patientsApi.remove(patient.id),

    onMutate: async (patient) => {
      await queryClient.cancelQueries({ queryKey: qk.patients.all });
      await queryClient.cancelQueries({ queryKey: qk.doctors.all });

      // Snapshot both: the nested drawer list lives under the doctors key.
      const snapshot = [
        ...queryClient.getQueriesData({ queryKey: qk.patients.all }),
        ...queryClient.getQueriesData({ queryKey: qk.doctors.all }),
      ];

      const remove = (old: { items: Patient[]; meta: { total: number } } | undefined) =>
        old
          ? {
              ...old,
              items: old.items.filter((p) => p.id !== patient.id),
              meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            }
          : old;

      queryClient.setQueriesData({ queryKey: qk.patients.all }, remove);
      queryClient.setQueriesData({ queryKey: qk.doctors.all }, (old: unknown) => {
        // Only the nested patient lists have an `items` array of patients.
        const typed = old as { items?: Array<{ doctorId?: string }> } | undefined;
        if (!typed?.items || !typed.items.some((i) => 'doctorId' in i)) return old;
        return remove(old as { items: Patient[]; meta: { total: number } });
      });

      return { snapshot };
    },

    onError: (_err, _patient, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Could not remove the patient');
    },

    onSuccess: (_result, patient) => toast.success(`${patient.name} removed`),

    onSettled: invalidate,
  });
}
