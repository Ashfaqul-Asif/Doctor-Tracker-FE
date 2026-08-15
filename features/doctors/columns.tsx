'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DoctorStatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import type { Doctor } from '@/lib/api/types';

interface Actions {
  onViewPatients: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

/**
 * Built inside a useMemo by the caller — an inline array would give TanStack Table a
 * new `columns` identity every render and force it to rebuild.
 *
 * `meta` drives both the desktop table (sortKey, align) and the mobile card layout
 * (primary, mobileLabel, hideOnMobile), so the two views cannot drift.
 */
export function buildDoctorColumns({
  onViewPatients,
  onEdit,
  onDelete,
}: Actions): ColumnDef<Doctor, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      meta: { sortKey: 'name', primary: true },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      meta: { sortKey: 'specialization', mobileLabel: 'Specialization' },
      cell: ({ row }) => <Badge variant="secondary">{row.original.specialization}</Badge>,
    },
    {
      accessorKey: 'hospital',
      header: 'Hospital',
      meta: { mobileLabel: 'Hospital' },
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.hospital}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      meta: { mobileLabel: 'Phone' },
      cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { mobileLabel: 'Status' },
      cell: ({ row }) => <DoctorStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'patientCount',
      header: 'Patients',
      // Sortable and range-filterable because the server denormalises this counter.
      meta: { sortKey: 'patientCount', align: 'right', mobileLabel: 'Patients' },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onViewPatients(row.original)}
          className="inline-flex items-center gap-1.5 rounded px-1 tabular-nums hover:text-primary hover:underline"
          aria-label={`View ${row.original.name}'s patients`}
        >
          <Users className="h-3.5 w-3.5" />
          {row.original.patientCount}
        </button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      meta: { sortKey: 'createdAt', mobileLabel: 'Added' },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onViewPatients(row.original)}>
                <Eye />
                View patients
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => onDelete(row.original)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
