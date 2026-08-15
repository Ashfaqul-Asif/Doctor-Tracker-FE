import type { Metadata } from 'next';
import { PatientsTable } from '@/features/patients/PatientsTable';

export const metadata: Metadata = { title: 'Patients · Doctor Tracker' };

/** Spec §2.3 — the "Dedicated Patient Page". */
export default function PatientsPage() {
  return <PatientsTable />;
}
