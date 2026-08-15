'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Delay propagating a value until it stops changing.
 *
 * This limits NETWORK calls — one request per settled search term instead of one
 * per keystroke. It is a different concern from `useDeferredValue`, which keeps the
 * input responsive while an expensive re-render happens. The search box uses both,
 * deliberately.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer.current);
  }, [value, delayMs]);

  return debounced;
}
