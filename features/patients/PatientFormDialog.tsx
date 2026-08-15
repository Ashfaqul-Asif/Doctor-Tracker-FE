'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/common/FormField';
import { applyServerErrors } from '@/lib/forms/applyServerErrors';
import {
  patientFormSchema,
  type PatientFormOutput,
  type PatientFormValues,
} from '@/lib/schemas/patient';
import { GENDERS, PATIENT_STATUSES, type Doctor, type Patient } from '@/lib/api/types';
import { humanize, toDateInputValue } from '@/lib/utils/format';
import { useDoctorOptions, useAddPatientToDoctor } from '../doctors/hooks';
import { useCreatePatient, useUpdatePatient } from './hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit mode when present. */
  patient?: Patient | null;
  /** Set by the doctor drawer — hides the picker and posts to the nested route. */
  pinnedDoctor?: Doctor;
}

export function PatientFormDialog({ open, onOpenChange, patient, pinnedDoctor }: Props) {
  const isEdit = Boolean(patient);
  const { data: doctorOptions } = useDoctorOptions();

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const addToDoctor = useAddPatientToDoctor(pinnedDoctor?.id ?? null);

  // Three generics: field shape, context, and the transformed output the submit
  // handler receives. Without the third, RHF types onSubmit with the raw input.
  const form = useForm<PatientFormValues, unknown, PatientFormOutput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: { name: '', doctorId: '', condition: '', status: 'active' },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      patient
        ? {
            name: patient.name,
            doctorId: patient.doctorId,
            condition: patient.condition,
            status: patient.status,
            age: patient.age ?? '',
            gender: patient.gender ?? '',
            admittedAt: toDateInputValue(patient.admittedAt),
            phone: patient.phone ?? '',
            email: patient.email ?? '',
            notes: patient.notes ?? '',
          }
        : {
            name: '',
            doctorId: pinnedDoctor?.id ?? '',
            condition: '',
            status: 'active',
            age: '',
            gender: '',
            admittedAt: toDateInputValue(new Date().toISOString()),
            phone: '',
            email: '',
            notes: '',
          },
    );
  }, [open, patient, pinnedDoctor, reset]);

  async function onSubmit(values: PatientFormOutput) {
    // The resolver has already run the transforms, so '' is gone and age is a number.
    const payload = {
      ...values,
      admittedAt: values.admittedAt ? new Date(values.admittedAt).toISOString() : undefined,
    };

    try {
      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, input: payload });
      } else if (pinnedDoctor) {
        // Nested route, so the server pins the doctor from the URL.
        const { doctorId: _omit, ...rest } = payload;
        await addToDoctor.mutateAsync(rest);
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (applyServerErrors(err, setError)) return;
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit patient' : 'Add patient'}</DialogTitle>
          <DialogDescription>
            {pinnedDoctor
              ? `This patient will be assigned to ${pinnedDoctor.name}.`
              : isEdit
                ? 'Update this patient’s record.'
                : 'Register a new patient and assign them to a doctor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errors.root && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          )}

          <FormField label="Full name" error={errors.name?.message} required>
            {(p) => <Input {...p} {...register('name')} placeholder="Kamal Uddin" />}
          </FormField>

          {!pinnedDoctor && (
            <FormField label="Doctor" error={errors.doctorId?.message} required>
              {(p) => (
                <Select
                  value={watch('doctorId')}
                  onValueChange={(v) => setValue('doctorId', v, { shouldDirty: true })}
                >
                  <SelectTrigger id={p.id} aria-invalid={p['aria-invalid']}>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(doctorOptions ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} · {d.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Condition" error={errors.condition?.message} required>
              {(p) => <Input {...p} {...register('condition')} placeholder="Hypertension" />}
            </FormField>

            <FormField label="Status" error={errors.status?.message}>
              {(p) => (
                <Select
                  value={watch('status')}
                  onValueChange={(v) =>
                    setValue('status', v as PatientFormValues['status'], { shouldDirty: true })
                  }
                >
                  <SelectTrigger id={p.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATIENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {humanize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Age" error={errors.age?.message}>
              {(p) => <Input {...p} {...register('age')} type="number" min={0} max={130} />}
            </FormField>

            <FormField label="Gender" error={errors.gender?.message}>
              {(p) => (
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(v) =>
                    setValue('gender', v as PatientFormValues['gender'], { shouldDirty: true })
                  }
                >
                  <SelectTrigger id={p.id}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {humanize(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField label="Admitted" error={errors.admittedAt?.message}>
              {(p) => <Input {...p} {...register('admittedAt')} type="date" />}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" error={errors.phone?.message}>
              {(p) => <Input {...p} {...register('phone')} placeholder="Optional" />}
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              {(p) => <Input {...p} {...register('email')} type="email" placeholder="Optional" />}
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
