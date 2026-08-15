import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route gate. (Next 16 renamed the `middleware` file convention to `proxy`.)
 *
 * This checks only that the access-token cookie is PRESENT — it cannot validate it,
 * because the signing secret must never reach the client. So this is a UX gate that
 * avoids rendering an app shell that is about to 401; the real boundary is the API
 * refusing every unauthenticated request.
 *
 * It works because the API sets the access cookie with a 7-day maxAge while the JWT
 * inside expires in 15 minutes: presence means "logged in recently", and validity is
 * settled by the API (and refreshed transparently by the fetch wrapper).
 *
 * Reading the cookie at all is only possible because next.config.ts proxies the API
 * through this origin, which makes the cookie first-party.
 */
const PUBLIC_PATHS = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get('access_token')?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    // Preserve where they were headed so login can return them there.
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Everything except Next internals, static assets, and /api — the API path is
   * rewritten straight to the backend and must not be gated here, or /auth/login
   * would redirect to itself.
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
