'use client';

import dynamic from 'next/dynamic';
import { Activity, RotateCw, Stethoscope, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartCard } from '@/components/charts/ChartCard';
import { StatCard } from '@/components/charts/StatCard';
import { useDashboard, useDashboardControls } from './hooks';

/**
 * Recharts is client-only and heavy, so the charts are loaded dynamically with SSR
 * disabled — this keeps the library out of the server bundle and off the critical
 * path for the stat cards above them.
 */
const chartFallback = () => <Skeleton className="h-full w-full" />;

const TrendAreaChart = dynamic(
  () => import('@/components/charts/charts').then((m) => m.TrendAreaChart),
  { ssr: false, loading: chartFallback },
);
const DistributionDonut = dynamic(
  () => import('@/components/charts/charts').then((m) => m.DistributionDonut),
  { ssr: false, loading: chartFallback },
);
const CategoryBarChart = dynamic(
  () => import('@/components/charts/charts').then((m) => m.CategoryBarChart),
  { ssr: false, loading: chartFallback },
);
const TopDoctorsBarChart = dynamic(
  () => import('@/components/charts/charts').then((m) => m.TopDoctorsBarChart),
  { ssr: false, loading: chartFallback },
);

export function DashboardGrid() {
  const { controls, setControls, params } = useDashboardControls();
  const { data, isLoading, isError, refetch } = useDashboard(params);

  if (isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="font-medium">Could not load analytics</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      </>
    );
  }

  const totals = data?.totals;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Totals, trends and distribution across the practice."
        action={
          <div className="flex items-center gap-2">
            <Select
              value={controls.granularity}
              onValueChange={(v) =>
                void setControls({ granularity: v as typeof controls.granularity })
              }
            >
              <SelectTrigger className="h-9 w-[7.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(controls.months)}
              onValueChange={(v) => void setControls({ months: Number(v) })}
            >
              <SelectTrigger className="h-9 w-[8.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total doctors"
          value={totals?.doctors ?? 0}
          icon={Stethoscope}
          isLoading={isLoading}
        />
        <StatCard
          label="Total patients"
          value={totals?.patients ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          label="Patients per doctor"
          value={totals?.avgPatientsPerDoctor ?? 0}
          hint="Average across all doctors"
          icon={Activity}
          isLoading={isLoading}
          decimals
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Registrations over time"
          description="New patients and doctors per period"
          isLoading={isLoading}
          isEmpty={!data?.patients.trend.length}
          className="lg:col-span-2"
        >
          {data && (
            <TrendAreaChart
              patients={data.patients.trend}
              doctors={data.doctors.trend}
              granularity={controls.granularity}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Doctors by specialization"
          isLoading={isLoading}
          isEmpty={!data?.doctors.bySpecialization.length}
        >
          {data && <DistributionDonut data={data.doctors.bySpecialization} />}
        </ChartCard>

        {/* Honest label: the API reads the denormalised counter rather than grouping
            patients, so a zero-patient doctor is never dropped — but this chart is
            capped at 10, so beyond that they fall off the end. The doctors page's
            "No patients" filter is where idle doctors are actually surfaced. */}
        <ChartCard
          title="Patients per doctor"
          description="Top 10 by patient load"
          isLoading={isLoading}
          isEmpty={!data?.topDoctors.length}
          className="lg:col-span-2"
        >
          {data && <TopDoctorsBarChart data={data.topDoctors} />}
        </ChartCard>

        <ChartCard
          title="Patients by status"
          isLoading={isLoading}
          isEmpty={!data?.patients.byStatus.length}
        >
          {data && <DistributionDonut data={data.patients.byStatus} />}
        </ChartCard>

        <ChartCard
          title="Top conditions"
          description="Most frequent patient conditions"
          isLoading={isLoading}
          isEmpty={!data?.patients.byCondition.length}
          className="lg:col-span-3"
        >
          {data && <CategoryBarChart data={data.patients.byCondition} />}
        </ChartCard>
      </div>
    </>
  );
}
