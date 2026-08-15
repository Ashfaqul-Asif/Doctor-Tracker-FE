import type { Metadata } from 'next';
import { DoctorsTable } from '@/features/doctors/DoctorsTable';

export const metadata: Metadata = { title: 'Doctors · Doctor Tracker' };

export default function DoctorsPage() {
  return <DoctorsTable />;
}
