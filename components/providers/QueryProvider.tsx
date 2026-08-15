'use client';

import { useEffect, useState } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@/lib/api/ApiError';
import { onHardLogout } from '@/lib/api/client';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Matches the server's own short TTL cache — refetching sooner would just
        // re-read a cached response over the network.
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        /**
         * Never retry a 4xx. Retrying a 401 would multiply the refresh stampede the
         * single-flight latch exists to prevent, and retrying a 422 just repeats a
         * validation failure the user has to fix.
         */
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

        // An admin tabbing back to the window does not want their table reset.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },

    queryCache: new QueryCache({
      onError: (error) => {
        // 401s are handled inside the fetch wrapper (refresh, then hard logout).
        // Anything else surfaces through the component's own error state.
        if (error instanceof ApiError && error.status === 401) return;
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  // One client per browser session; a fresh one per request on the server.
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  useEffect(() => {
    // A dead session must not leave the previous user's rows in the cache for
    // whoever logs in next.
    return onHardLogout(() => {
      queryClient.clear();
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
