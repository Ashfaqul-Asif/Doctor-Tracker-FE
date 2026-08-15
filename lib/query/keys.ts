import type { DashboardParams, DoctorListParams, PatientListParams } from '@/lib/api/types';

/**
 * Every query key comes from here.
 *
 * Centralising them means invalidation can target a whole entity (`qk.doctors.all`)
 * without listing every parameter combination, and a typo cannot silently create a
 * second cache entry that never gets invalidated.
 */
export const qk = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  doctors: {
    all: ['doctors'] as const,
    list: (params: DoctorListParams) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    options: () => ['doctors', 'options'] as const,
    facets: () => ['doctors', 'facets'] as const,
    patients: (id: string, params: PatientListParams) =>
      ['doctors', id, 'patients', params] as const,
  },

  patients: {
    all: ['patients'] as const,
    list: (params: PatientListParams) => ['patients', 'list', params] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
    facets: () => ['patients', 'facets'] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    dashboard: (params: DashboardParams) => ['analytics', 'dashboard', params] as const,
  },
} as const;
