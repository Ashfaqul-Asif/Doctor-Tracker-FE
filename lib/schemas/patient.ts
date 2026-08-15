import { z } from 'zod';
import { GENDERS, PATIENT_STATUSES, type Gender, type PatientStatus } from '@/lib/api/types';

/**
 * Mirrors the server's createPatientSchema.
 *
 * Optional fields accept '' because that is what an empty input actually produces,
 * then transform it to undefined — sending '' would fail the server's own validation
 * on a field the user simply left blank.
 */
export const patientFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  doctorId: z.string().trim().min(1, 'Select a doctor'),
  condition: z.string().trim().min(2, 'Condition is required').max(160),
  status: z.enum([...PATIENT_STATUSES] as [PatientStatus, ...PatientStatus[]]),

  age: z
    .union([z.coerce.number().int().min(0, 'Age cannot be negative').max(130), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : Number(v))),

  gender: z
    .union([z.enum([...GENDERS] as [Gender, ...Gender[]]), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : (v as Gender))),

  admittedAt: z.string().optional(),

  phone: z
    .union([
      z
        .string()
        .trim()
        .min(6, 'Phone number is too short')
        .max(32)
        .regex(/^[+()\-\s\d]+$/, 'Only digits, spaces, +, - and parentheses'),
      z.literal(''),
    ])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  email: z
    .union([
      z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
      z.literal(''),
    ])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

/** What the form fields hold (age may be '' while typing). */
export type PatientFormValues = z.input<typeof patientFormSchema>;
/** What reaches the API after transforms. */
export type PatientFormOutput = z.output<typeof patientFormSchema>;
