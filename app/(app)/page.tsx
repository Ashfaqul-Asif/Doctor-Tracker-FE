import type { Metadata } from 'next';
import { DashboardGrid } from '@/features/dashboard/DashboardGrid';

export const metadata: Metadata = { title: 'Dashboard · Doctor Tracker' };

export default function DashboardPage() {
  return <DashboardGrid />;
}
