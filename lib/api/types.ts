/**
 * Mirrors the API contract in server/src. Kept by hand rather than generated: the
 * surface is small, and a shared workspace package is the answer only at a scale
 * this project does not have. The server stays authoritative — see the 422 -> form
 * error mapping in lib/api/ApiError.ts.
 */

export interface ErrorDetail {
  path: string;
  message: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: ErrorDetail[] };
  requestId?: string;
}

/** A list response after unwrapping: items plus their pagination metadata. */
export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type DoctorStatus = 'active' | 'on-leave' | 'inactive';
export const DOCTOR_STATUSES: DoctorStatus[] = ['active', 'on-leave', 'inactive'];

export type PatientStatus = 'active' | 'under-observation' | 'recovered' | 'discharged';
export const PATIENT_STATUSES: PatientStatus[] = [
  'active',
  'under-observation',
  'recovered',
  'discharged',
];

export type Gender = 'male' | 'female' | 'other';
export const GENDERS: Gender[] = ['male', 'female', 'other'];

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  patientCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  doctorId: string;
  /** Denormalised on the server so the list needs no join. */
  doctorName: string;
  age?: number;
  gender?: Gender;
  condition: string;
  status: PatientStatus;
  admittedAt: string;
  phone?: string;
  email?: string;
  notes?: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
}

export interface DoctorFacets {
  specializations: string[];
  hospitals: string[];
  statuses: { value: string; count: number }[];
}

export interface PatientFacets {
  conditions: string[];
  statuses: { value: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface LabelCount {
  label: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TopDoctor {
  id: string;
  name: string;
  specialization: string;
  patientCount: number;
}

export interface DashboardData {
  totals: { doctors: number; patients: number; avgPatientsPerDoctor: number };
  patients: {
    byCondition: LabelCount[];
    byStatus: LabelCount[];
    byGender: LabelCount[];
    trend: TrendPoint[];
  };
  doctors: {
    bySpecialization: LabelCount[];
    byStatus: LabelCount[];
    trend: TrendPoint[];
  };
  topDoctors: TopDoctor[];
  window: { from: string; to: string; granularity: Granularity; timezone: string };
}

export type Granularity = 'day' | 'week' | 'month';

// ---------------------------------------------------------------------------
// List params — names match the server's zod schemas exactly
// ---------------------------------------------------------------------------

export const DATE_PRESETS = [
  'today',
  'yesterday',
  'last7d',
  'last30d',
  'thisMonth',
  'lastMonth',
  'thisYear',
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const DOCTOR_SORT_KEYS = [
  'createdAt',
  'updatedAt',
  'name',
  'patientCount',
  'specialization',
] as const;
export type DoctorSortKey = (typeof DOCTOR_SORT_KEYS)[number];

export const PATIENT_SORT_KEYS = [
  'createdAt',
  'updatedAt',
  'admittedAt',
  'name',
  'age',
  'doctorName',
] as const;
export type PatientSortKey = (typeof PATIENT_SORT_KEYS)[number];

export type SortOrder = 'asc' | 'desc';

export interface DoctorListParams {
  search?: string;
  specialization?: string[];
  hospital?: string[];
  status?: string[];
  minPatients?: number;
  maxPatients?: number;
  hasPatients?: 'true' | 'false';
  dateFrom?: string;
  dateTo?: string;
  datePreset?: DatePreset;
  dateField?: 'createdAt' | 'updatedAt';
  timezone?: string;
  sortBy?: DoctorSortKey;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface PatientListParams {
  search?: string;
  doctorId?: string[];
  condition?: string[];
  status?: string[];
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: DatePreset;
  dateField?: 'admittedAt' | 'createdAt' | 'updatedAt';
  timezone?: string;
  sortBy?: PatientSortKey;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface DashboardParams {
  granularity?: Granularity;
  months?: number;
  timezone?: string;
}

// ---------------------------------------------------------------------------
// Write payloads
// ---------------------------------------------------------------------------

export interface DoctorInput {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status?: DoctorStatus;
}

export interface PatientInput {
  name: string;
  doctorId?: string;
  age?: number;
  gender?: Gender;
  condition: string;
  status?: PatientStatus;
  admittedAt?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  /** Only present when the caller opts into Bearer mode. Unused by this client. */
  refreshToken?: string;
}

export interface DeleteDoctorResult {
  id: string;
  deletedAt: string;
  cascadedPatients: number;
}
