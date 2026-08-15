'use client';

import { Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { QueryProvider } from './QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* nuqs reads searchParams, which needs a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <NuqsAdapter>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </QueryProvider>
        </NuqsAdapter>
      </Suspense>
    </ThemeProvider>
  );
}
