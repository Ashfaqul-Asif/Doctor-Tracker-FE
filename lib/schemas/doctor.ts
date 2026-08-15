import { z } from 'zod';
import { DOCTOR_STATUSES, type DoctorStatus } from '@/lib/api/types';

/**
 * Mirrors the server's createDoctorSchema. Kept in step by hand; the server stays
 * authoritative and its 422 details are mapped back onto these fields.
 */
export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  specialization: z.string().trim().min(2, 'Specialization is required').max(120),
  hospital: z.string().trim().min(2, 'Hospital is required').max(160),
  phone: z
    .string()
    .trim()
    .min(6, 'Phone number is too short')
    .max(32)
    .regex(/^[+()\-\s\d]+$/, 'Only digits, spaces, +, - and parentheses'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  // No .default() — it makes the schema's input type optional while its output is
  // required, and react-hook-form's resolver then refuses to line the two up. The
  // default lives in the form's defaultValues instead.
  status: z.enum([...DOCTOR_STATUSES] as [DoctorStatus, ...DoctorStatus[]]),
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;
