import { api, toQueryString } from './client';
import type {
  DashboardData,
  DashboardParams,
  DeleteDoctorResult,
  Doctor,
  DoctorFacets,
  DoctorInput,
  DoctorListParams,
  DoctorOption,
  LoginResponse,
  Paged,
  Patient,
  PatientFacets,
  PatientInput,
  PatientListParams,
  User,
} from './types';

/** One typed function per route. Nothing else in the app builds a URL by hand. */

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }, { skipAuthRetry: true }),

  logout: () => api.post<{ message: string }>('/auth/logout', undefined, { skipAuthRetry: true }),

  me: () => api.get<User>('/auth/me', { skipAuthRetry: true }),
};

export const doctorsApi = {
  list: (params: DoctorListParams) =>
    api.getPaged<Doctor>(`/doctors${toQueryString(params as Record<string, unknown>)}`),

  get: (id: string) => api.get<Doctor>(`/doctors/${id}`),

  options: () => api.get<DoctorOption[]>('/doctors/options'),

  facets: () => api.get<DoctorFacets>('/doctors/facets'),

  create: (input: DoctorInput) => api.post<Doctor>('/doctors', input),

  update: (id: string, input: Partial<DoctorInput>) => api.patch<Doctor>(`/doctors/${id}`, input),

  remove: (id: string) => api.delete<DeleteDoctorResult>(`/doctors/${id}`),

  /** Spec §2.2 — "view corresponding patients for each doctor". */
  patients: (id: string, params: PatientListParams): Promise<Paged<Patient>> =>
    api.getPaged<Patient>(
      `/doctors/${id}/patients${toQueryString(params as Record<string, unknown>)}`,
    ),

  /** Spec §2.2 — "add new patients under a specific doctor". */
  addPatient: (id: string, input: PatientInput) =>
    api.post<Patient>(`/doctors/${id}/patients`, input),
};

export const patientsApi = {
  list: (params: PatientListParams) =>
    api.getPaged<Patient>(`/patients${toQueryString(params as Record<string, unknown>)}`),

  get: (id: string) => api.get<Patient>(`/patients/${id}`),

  facets: () => api.get<PatientFacets>('/patients/facets'),

  create: (input: PatientInput) => api.post<Patient>('/patients', input),

  update: (id: string, input: Partial<PatientInput>) =>
    api.patch<Patient>(`/patients/${id}`, input),

  remove: (id: string) => api.delete<{ id: string; deletedAt: string }>(`/patients/${id}`),
};

export const analyticsApi = {
  dashboard: (params: DashboardParams) =>
    api.get<DashboardData>(`/analytics/dashboard${toQueryString(params as Record<string, unknown>)}`),
};
