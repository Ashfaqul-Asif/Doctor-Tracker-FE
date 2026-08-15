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
import { doctorFormSchema, type DoctorFormValues } from '@/lib/schemas/doctor';
import { DOCTOR_STATUSES, type Doctor } from '@/lib/api/types';
import { humanize } from '@/lib/utils/format';
import { useCreateDoctor, useUpdateDoctor } from './hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent = create mode. */
  doctor?: Doctor | null;
}

const EMPTY: DoctorFormValues = {
  name: '',
  specialization: '',
  hospital: '',
  phone: '',
  email: '',
  status: 'active',
};

export function DoctorFormDialog({ open, onOpenChange, doctor }: Props) {
  const isEdit = Boolean(doctor);
  const create = useCreateDoctor();
  const update = useUpdateDoctor();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: EMPTY,
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

  // Reset when the dialog opens so a previous edit never leaks into the next one.
  useEffect(() => {
    if (!open) return;
    reset(
      doctor
        ? {
            name: doctor.name,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
            phone: doctor.phone,
            email: doctor.email,
            status: doctor.status,
          }
        : EMPTY,
    );
  }, [open, doctor, reset]);

  async function onSubmit(values: DoctorFormValues) {
    try {
      if (isEdit && doctor) await update.mutateAsync({ id: doctor.id, input: values });
      else await create.mutateAsync(values);
      onOpenChange(false);
    } catch (err) {
      // A duplicate email comes back as 409 with a field path; it belongs on the input.
      if (applyServerErrors(err, setError)) return;
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit doctor' : 'Add doctor'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this doctor’s details.'
              : 'Register a new doctor in the directory.'}
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
            {(p) => <Input {...p} {...register('name')} placeholder="Ashfaqul Asif" />}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Specialization" error={errors.specialization?.message} required>
              {(p) => <Input {...p} {...register('specialization')} placeholder="Cardiology" />}
            </FormField>

            <FormField label="Hospital" error={errors.hospital?.message} required>
              {(p) => <Input {...p} {...register('hospital')} placeholder="Square Hospital" />}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone" error={errors.phone?.message} required>
              {(p) => <Input {...p} {...register('phone')} placeholder="+8801711000001" />}
            </FormField>

            <FormField label="Email" error={errors.email?.message} required>
              {(p) => (
                <Input {...p} {...register('email')} type="email" placeholder="doctor@hospital.com" />
              )}
            </FormField>
          </div>

          <FormField
            label="Status"
            error={errors.status?.message}
            hint="On leave and inactive doctors stay in the directory but are filtered out by default views."
          >
            {(p) => (
              <Select
                value={watch('status')}
                onValueChange={(v) =>
                  setValue('status', v as DoctorFormValues['status'], { shouldDirty: true })
                }
              >
                <SelectTrigger id={p.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCTOR_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {humanize(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add doctor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
