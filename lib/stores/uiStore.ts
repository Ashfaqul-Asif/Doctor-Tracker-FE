import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client-only preferences. Nothing here comes from the API.
 *
 * That rule matters: server data belongs to the TanStack Query cache, which handles
 * caching, invalidation, and refetching. Duplicating it into Zustand is the most
 * common way this stack goes wrong — two sources of truth that drift.
 *
 * Always read with a selector (`useUiStore(s => s.sidebarOpen)`); subscribing to the
 * whole store re-renders on every unrelated change.
 */
interface UiState {
  sidebarOpen: boolean;
  density: 'comfortable' | 'compact';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      density: 'comfortable',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setDensity: (density) => set({ density }),
    }),
    {
      name: 'doctor-tracker-ui',
      /**
       * `skipHydration` stops the store reading localStorage the instant this module
       * evaluates. Without it, the client's FIRST render already reflects whatever
       * was persisted (e.g. sidebarOpen: false) while the server — which has no
       * localStorage — always rendered the `true` default. Any element whose class
       * or attribute depends on this state would then mismatch on that first paint,
       * which is exactly the "attributes didn't match" hydration error.
       *
       * Rehydration is deferred to `useHydratedUiStore` below, so it happens after
       * mount, once server and client have already agreed on one shared render.
       */
      skipHydration: true,
    },
  ),
);

/**
 * Use this instead of `useUiStore` in any component whose OUTPUT depends on the
 * persisted value (a className, a data-attribute, conditional markup). It returns
 * the safe SSR default until the store has rehydrated from localStorage, then
 * re-renders once with the real value — never claiming a value the server could not
 * have known.
 *
 * `useUiStore` directly is still fine for values read only inside an event handler
 * (a click), since those never run during SSR.
 */
export function useHydratedUiStore<T>(selector: (state: UiState) => T): T {
  const [hydrated, setHydrated] = useState(false);
  const value = useUiStore(selector);
  const serverValue = useUiStore.getInitialState();

  useEffect(() => {
    useUiStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated ? value : selector(serverValue);
}
