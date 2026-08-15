import type { ApiFailure, ErrorDetail } from './types';

/**
 * A failed API call, carrying the machine-readable code and per-field details the
 * server returns so forms can attach errors to the right input.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[];
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details: ErrorDetail[] = [],
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /** True for the codes that mean "this session is over", not "retry later". */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: Partial<ApiFailure> | null = null;
    try {
      body = (await res.json()) as ApiFailure;
    } catch {
      // A proxy timeout or a crash can return HTML or nothing at all.
    }

    return new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? res.statusText ?? 'Request failed',
      body?.error?.details ?? [],
      body?.requestId,
    );
  }
}

/** A network failure, distinct from an HTTP error — nothing reached the server. */
export class NetworkError extends ApiError {
  constructor(message = 'Could not reach the server') {
    super(0, 'NETWORK_ERROR', message);
    this.name = 'NetworkError';
  }
}
