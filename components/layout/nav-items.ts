import { LayoutDashboard, Stethoscope, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Exactly three destinations.
 *
 * Spec §4: "Clear navigation between: Dashboard, Doctors, Patients". A doctor's own
 * patient list (§2.2) is therefore a drawer on /doctors rather than a fourth entry
 * here — it is required functionality, but not a required destination.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/patients', label: 'Patients', icon: Users },
];
