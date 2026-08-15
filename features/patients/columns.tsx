'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PatientStatusBadge } from '@/components/common/StatusBadge';
import { formatDate, humanize } from '@/lib/utils/format';
import type { Patient } from '@/lib/api/types';

interface Actions {
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

export function buildPatientColumns({ onEdit, onDelete }: Actions): ColumnDef<Patient, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Patient',
      meta: { sortKey: 'name', primary: true },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.original.age !== undefined && `${row.original.age}y`}
            {row.original.age !== undefined && row.original.gender && ' · '}
            {row.original.gender && humanize(row.original.gender)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'doctorName',
      header: 'Doctor',
      // Denormalised on the server, so this column costs no join and is searchable.
      meta: { sortKey: 'doctorName', mobileLabel: 'Doctor' },
      cell: ({ row }) => <span className="truncate">{row.original.doctorName}</span>,
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      meta: { mobileLabel: 'Condition' },
      cell: ({ row }) => <Badge variant="secondary">{row.original.condition}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { mobileLabel: 'Status' },
      cell: ({ row }) => <PatientStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'admittedAt',
      header: 'Admitted',
      meta: { sortKey: 'admittedAt', mobileLabel: 'Admitted' },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.admittedAt)}
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
