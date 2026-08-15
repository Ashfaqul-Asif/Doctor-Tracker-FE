import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api/ApiError';

/**
 * Map a 422 from the API onto the form fields that caused it.
 *
 * This is what keeps the client-side zod schemas from being a correctness risk: even
 * if they drift from the server's, the server's per-field `details` land on the right
 * input rather than surfacing as one opaque banner.
 *
 * Returns true when the error was consumed as field errors, so callers know whether
 * a toast is still needed.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;

  if (error.isValidationError && error.details.length > 0) {
    for (const detail of error.details) {
      setError(detail.path as Path<T>, { type: 'server', message: detail.message });
    }
    return true;
  }

  // 409 duplicate-email is a field problem even though it is not a 422.
  if (error.status === 409 && error.details.length > 0) {
    for (const detail of error.details) {
      setError(detail.path as Path<T>, { type: 'server', message: error.message });
    }
    return true;
  }

  return false;
}
