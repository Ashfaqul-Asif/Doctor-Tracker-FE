'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

export interface DataTableSearchHandle {
  focus: () => void;
  clear: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Search input with a local draft that debounces up to the URL.
 *
 * The draft is local state so every keystroke renders only this input. The debounced
 * value is what reaches the URL and therefore the query key — one request per settled
 * term rather than one per keystroke.
 *
 * `useImperativeHandle` exposes focus/clear so "Clear filters" elsewhere in the
 * toolbar can return focus here. A callback prop would also work; this keeps the
 * imperative concern (focus) off the data path.
 */
export const DataTableSearch = forwardRef<DataTableSearchHandle, Props>(function DataTableSearch(
  { value, onChange, placeholder = 'Search…' },
  ref,
) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPushed = useRef(value);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      setDraft('');
      onChange('');
    },
  }));

  // Push the settled term upward. Guarded so it does not re-emit a value that
  // arrived from the URL, which would loop.
  useEffect(() => {
    if (debounced !== lastPushed.current) {
      lastPushed.current = debounced;
      onChange(debounced);
    }
  }, [debounced, onChange]);

  // Accept external resets (Clear filters, back button) without clobbering typing.
  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setDraft(value);
    }
  }, [value]);

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8"
        type="search"
        aria-label={placeholder}
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
