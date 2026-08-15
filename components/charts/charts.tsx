'use client';

import { memo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { Granularity, LabelCount, TopDoctor, TrendPoint } from '@/lib/api/types';

/**
 * Colours come from CSS custom properties, so dark mode works with no JS branch —
 * the variables change and Recharts picks up the new values on the next paint.
 */
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

const axisStyle = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
};

function formatBucket(iso: string, granularity: Granularity): string {
  try {
    const d = parseISO(iso);
    if (granularity === 'month') return format(d, 'MMM yy');
    return format(d, 'd MMM');
  } catch {
    return iso;
  }
}

interface TrendProps {
  patients: TrendPoint[];
  doctors: TrendPoint[];
  granularity: Granularity;
}

/**
 * Memoised: Recharts re-renders are expensive and this data only changes on a
 * refetch, not when an unrelated piece of the page updates.
 */
export const TrendAreaChart = memo(function TrendAreaChart({
  patients,
  doctors,
  granularity,
}: TrendProps) {
  const data = patients.map((point, i) => ({
    date: formatBucket(point.date, granularity),
    Patients: point.count,
    Doctors: doctors[i]?.count ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillPatients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillDoctors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Patients"
          stroke={CHART_COLORS[0]}
          fill="url(#fillPatients)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Doctors"
          stroke={CHART_COLORS[1]}
          fill="url(#fillDoctors)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const DistributionDonut = memo(function DistributionDonut({
  data,
}: {
  data: LabelCount[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius="52%"
          outerRadius="78%"
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
});

export const CategoryBarChart = memo(function CategoryBarChart({ data }: { data: LabelCount[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={64}
        />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

/**
 * Horizontal bars, because doctor names are long.
 *
 * The API builds this from the denormalised patientCount rather than by grouping
 * patients, so doctors with ZERO patients still appear — which is exactly the fact
 * an admin most needs to see.
 */
export const TopDoctorsBarChart = memo(function TopDoctorsBarChart({
  data,
}: {
  data: TopDoctor[];
}) {
  const rows = data.map((d) => ({ name: d.name, count: d.patientCount }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
