'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { analyticsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query/keys';
import { localTimezone } from '@/lib/utils/format';
import type { DashboardParams } from '@/lib/api/types';

const GRANULARITIES = ['day', 'week', 'month'] as const;

/** Granularity and window live in the URL, so a dashboard view is shareable. */
export function useDashboardControls() {
  const [controls, setControls] = useQueryStates(
    {
      granularity: parseAsStringLiteral(GRANULARITIES).withDefault('month'),
      months: parseAsInteger.withDefault(12),
    },
    { history: 'replace', shallow: true },
  );

  const params = useMemo<DashboardParams>(
    () => ({
      granularity: controls.granularity,
      months: controls.months,
      // Sent so date buckets line up with the viewer's calendar rather than UTC.
      timezone: localTimezone(),
    }),
    [controls],
  );

  return { controls, setControls, params };
}

/**
 * One request for the whole dashboard.
 *
 * The API returns every tile from a single $facet pipeline, so this page issues one
 * query rather than six — and there is no chance of the cards disagreeing with the
 * charts because they came from different reads.
 */
export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: qk.analytics.dashboard(params),
    queryFn: () => analyticsApi.dashboard(params),
    staleTime: 30_000,
  });
}
