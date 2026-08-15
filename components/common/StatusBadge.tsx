import { Badge } from '@/components/ui/badge';
import { humanize } from '@/lib/utils/format';
import type { DoctorStatus, PatientStatus } from '@/lib/api/types';

type Variant = React.ComponentProps<typeof Badge>['variant'];

const DOCTOR_VARIANTS: Record<DoctorStatus, Variant> = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'muted',
};

const PATIENT_VARIANTS: Record<PatientStatus, Variant> = {
  active: 'default',
  'under-observation': 'warning',
  recovered: 'success',
  discharged: 'muted',
};

export function DoctorStatusBadge({ status }: { status: DoctorStatus }) {
  return <Badge variant={DOCTOR_VARIANTS[status] ?? 'muted'}>{humanize(status)}</Badge>;
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return <Badge variant={PATIENT_VARIANTS[status] ?? 'muted'}>{humanize(status)}</Badge>;
}
