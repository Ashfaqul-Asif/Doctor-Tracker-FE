import type { NextConfig } from 'next';

/**
 * API_ORIGIN is deliberately NOT prefixed with NEXT_PUBLIC_ — it is read only here,
 * on the server, so the backend's address is never shipped to the browser.
 */
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:5000';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Pin the workspace root. Without this, Turbopack walks up the filesystem, finds
   * an unrelated lockfile in the user's home directory, and infers the wrong root.
   */
  turbopack: { root: __dirname },

  /**
   * Same-origin proxy to the standalone Express API.
   *
   * The client and API are deployed as two separate Vercel projects, which sit on
   * different registrable domains (vercel.app is on the Public Suffix List). Called
   * directly, the auth cookie would be third-party: Safari blocks those outright and
   * Chrome is phasing them out, so login would simply fail for some reviewers.
   *
   * Routing every request through the client's own origin makes the cookie
   * first-party, so it works in every browser, `middleware.ts` can read it, and no
   * token is ever exposed to JavaScript. The backend stays a separately deployed
   * standalone server, as the spec requires.
   *
   * This works because the API sets cookies with no Domain attribute, so each binds
   * to whatever host served the response — here, this app's origin.
   */
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
