'use client';

import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_PRESETS, type DatePreset } from '@/lib/api/types';

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7d: 'Last 7 days',
  last30d: 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisYear: 'This year',
};

interface DateFieldOption {
  value: string;
  label: string;
}

interface Props {
  datePreset: DatePreset | null;
  dateFrom: string | null;
  dateTo: string | null;
  dateField: string;
  dateFieldOptions: DateFieldOption[];
  onChange: (next: {
    datePreset?: DatePreset | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    dateField?: string;
  }) => void;
}

/**
 * Date-wise filtering (spec §2.2 / §2.3).
 *
 * Presets and an explicit range are mutually exclusive — the API rejects both
 * together with a 422, so selecting one clears the other here rather than letting
 * the user build a request that cannot succeed.
 *
 * `dateField` exists because "date-wise" is ambiguous: for patients, admission date
 * and record-entry date answer different questions, so the caller picks.
 */
export function DataTableDateFilter({
  datePreset,
  dateFrom,
  dateTo,
  dateField,
  dateFieldOptions,
  onChange,
}: Props) {
  const active = Boolean(datePreset || dateFrom || dateTo);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <CalendarDays />
          Date
          {active && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {datePreset ? PRESET_LABELS[datePreset] : 'Range'}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 space-y-3" align="start">
        {dateFieldOptions.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Filter on</Label>
            <Select value={dateField} onValueChange={(v) => onChange({ dateField: v })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFieldOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Quick range</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={datePreset === preset ? 'default' : 'outline'}
                size="sm"
                className="h-8 justify-start text-xs"
                onClick={() =>
                  onChange(
                    datePreset === preset
                      ? { datePreset: null }
                      : // Clear the explicit range: the API rejects both at once.
                        { datePreset: preset, dateFrom: null, dateTo: null },
                  )
                }
              >
                {PRESET_LABELS[preset]}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label className="text-xs">Custom range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom ?? ''}
              max={dateTo ?? undefined}
              onChange={(e) =>
                onChange({ dateFrom: e.target.value || null, datePreset: null })
              }
              className="h-8 text-xs"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo ?? ''}
              min={dateFrom ?? undefined}
              onChange={(e) => onChange({ dateTo: e.target.value || null, datePreset: null })}
              className="h-8 text-xs"
              aria-label="To date"
            />
          </div>
        </div>

        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onChange({ datePreset: null, dateFrom: null, dateTo: null })}
          >
            Clear dates
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
