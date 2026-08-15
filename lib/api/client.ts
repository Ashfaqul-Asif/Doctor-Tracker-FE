import { ApiError, NetworkError } from './ApiError';
import type { ApiSuccess, PageMeta, Paged } from './types';

/**
 * Relative on purpose. next.config.ts rewrites /api/* to the standalone Express
 * deployment, so the browser only ever talks to this app's own origin — which is
 * what makes the auth cookie first-party and keeps every token out of JavaScript.
 */
const BASE = '/api/v1';

// ---------------------------------------------------------------------------
// Bearer fallback (dormant on the proxy path)
// ---------------------------------------------------------------------------

/**
 * Held in memory only, never persisted. Unused while cookies work; it exists so a
 * direct cross-origin deployment needs no code change.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

function authHeader(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// ---------------------------------------------------------------------------
// Session teardown
// ---------------------------------------------------------------------------

type LogoutListener = () => void;
const logoutListeners = new Set<LogoutListener>();

/** QueryProvider registers here so a dead session clears the cache exactly once. */
export function onHardLogout(fn: LogoutListener): () => void {
  logoutListeners.add(fn);
  return () => logoutListeners.delete(fn);
}

let loggingOut = false;

export function hardLogout(): void {
  // Several in-flight requests can fail together; tear down once.
  if (loggingOut) return;
  loggingOut = true;

  accessToken = null;
  logoutListeners.forEach((fn) => fn());

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }

  // Released on the next tick so a genuine later logout still works.
  setTimeout(() => {
    loggingOut = false;
  }, 1000);
}

// ---------------------------------------------------------------------------
// Single-flight refresh — the critical bit
// ---------------------------------------------------------------------------

/**
 * The backend rotates refresh tokens and DETECTS REUSE: presenting an
 * already-rotated token revokes the whole family and forces a re-login.
 *
 * A dashboard mounts several queries at once. When the access token expires they
 * all 401 together — and if each fired its own /auth/refresh, the first would
 * rotate the token and the rest would present the now-revoked one. The server would
 * correctly read that as theft and log the user out for doing nothing wrong.
 *
 * So every concurrent 401 awaits the SAME promise: one network call, one rotation.
 */
let refreshPromise: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  refreshPromise ??= (async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw await ApiError.fromResponse(res);

    const body = (await res.json()) as ApiSuccess<{ accessToken: string }>;
    setAccessToken(body.data.accessToken);
  })().finally(() => {
    // Cleared in `finally` so a failed refresh cannot wedge the latch permanently.
    refreshPromise = null;
  });

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skips the 401 -> refresh -> retry path. Used by the auth calls themselves. */
  skipAuthRetry?: boolean;
}

async function request(path: string, options: RequestOptions = {}, retry = true): Promise<Response> {
  const { body, skipAuthRetry, headers, ...rest } = options;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(headers as Record<string, string>),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401 && retry && !skipAuthRetry) {
    const failure = await res
      .clone()
      .json()
      .catch(() => null);
    const code = failure?.error?.code;

    // Only an expired access token is refreshable. INVALID_TOKEN and
    // TOKEN_REUSE_DETECTED mean the session is already dead, and refreshing on
    // those would loop.
    if (code === 'TOKEN_EXPIRED') {
      try {
        await refreshOnce();
      } catch {
        hardLogout();
        throw await ApiError.fromResponse(res);
      }
      // Retry exactly once: `retry = false` means a still-401 response falls
      // through instead of recursing.
      return request(path, options, false);
    }

    hardLogout();
  }

  return res;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw await ApiError.fromResponse(res);
  const body = (await res.json()) as ApiSuccess<T>;
  return body.data;
}

/** For list endpoints: returns items and pagination together. */
async function unwrapPaged<T>(res: Response): Promise<Paged<T>> {
  if (!res.ok) throw await ApiError.fromResponse(res);
  const body = (await res.json()) as ApiSuccess<T[]>;
  const fallback: PageMeta = {
    page: 1,
    limit: body.data.length,
    total: body.data.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  return { items: body.data, meta: body.meta ?? fallback };
}

/**
 * Serialise params the way the API expects: arrays as comma-separated values
 * (matching the server's `csvString`), and empty values omitted entirely — an
 * `undefined` that becomes the literal string "undefined" would filter everything out.
 */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return unwrap<T>(await request(path, { ...options, method: 'GET' }));
  },
  async getPaged<T>(path: string, options?: RequestOptions): Promise<Paged<T>> {
    return unwrapPaged<T>(await request(path, { ...options, method: 'GET' }));
  },
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return unwrap<T>(await request(path, { ...options, method: 'POST', body }));
  },
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return unwrap<T>(await request(path, { ...options, method: 'PATCH', body }));
  },
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return unwrap<T>(await request(path, { ...options, method: 'DELETE' }));
  },
};
