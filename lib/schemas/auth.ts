import { z } from 'zod';

/**
 * Mirrors the server's loginSchema for instant feedback. The server remains
 * authoritative — its 422 details are mapped back onto the form fields, so a drift
 * between these two still produces a correctly-targeted error.
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginValues = z.infer<typeof loginSchema>;
