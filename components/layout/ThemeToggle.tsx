'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Both icons are rendered and CSS picks the right one.
 *
 * The usual approach — a `mounted` flag set in an effect — exists because the server
 * cannot know the resolved theme. But that costs a cascading render on every load
 * and still flashes the wrong icon for a frame. Letting the `dark:` variant do the
 * switching is correct on first paint, needs no effect, and cannot desync.
 *
 * `resolvedTheme` is read only inside the click handler, which runs after mount, so
 * it never participates in hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle light or dark theme"
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  );
}
