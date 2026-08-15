'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * `useSyncExternalStore` rather than useState+useEffect: it is the tear-free way to
 * read an external mutable source, and it takes a server snapshot explicitly, so SSR
 * renders the mobile-first branch instead of hydrating with a mismatched value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // The server has no viewport; assume small so mobile markup is what hydrates.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tailwind's `md` breakpoint. Below this, tables render as cards. */
export const useIsMobile = () => !useMediaQuery('(min-width: 768px)');

/** Tailwind's `lg`. Below this, the sidebar collapses into a sheet. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
