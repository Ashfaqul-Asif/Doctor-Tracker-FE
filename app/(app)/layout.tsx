import { AppShell } from '@/components/layout/AppShell';

/**
 * Everything in this route group sits behind the middleware gate, so a signed-out
 * visitor is redirected before any of it renders.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
