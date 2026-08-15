'use client';

import { useDebugValue } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/endpoints';
import { setAccessToken } from '@/lib/api/client';
import { ApiError } from '@/lib/api/ApiError';
import { qk } from '@/lib/query/keys';
import type { User } from '@/lib/api/types';

/**
 * The current user, owned by the query cache.
 *
 * Any component at any depth calls this — the user is never threaded through props,
 * and there is no bespoke AuthContext duplicating what the cache already does.
 */
export function useAuth() {
  const query = useQuery<User>({
    queryKey: qk.auth.me(),
    queryFn: authApi.me,
    // The session outlives a tab; re-asking on every mount is wasted.
    staleTime: 5 * 60_000,
    // A 401 here means "not logged in", which is an answer, not a failure to retry.
    retry: false,
  });

  useDebugValue(query.data ? `${query.data.email} (${query.data.role})` : 'signed out');

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),

    onSuccess: (data, _vars) => {
      // Held in memory for the Bearer fallback; unused while the cookie works.
      setAccessToken(data.accessToken);
      queryClient.setQueryData(qk.auth.me(), data.user);

      const next = new URLSearchParams(window.location.search).get('next');
      // Only allow same-site paths — an absolute URL here would be an open redirect.
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
      router.replace(target);
      // The middleware gate reads a cookie, so the tree must re-evaluate server-side.
      router.refresh();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    // Log out locally even if the network call fails — the alternative is a user
    // stuck in a session they explicitly asked to end.
    onSettled: () => {
      setAccessToken(null);
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
    onError: (err) => {
      if (err instanceof ApiError && !err.isAuthError) toast.error('Logout may not have completed');
    },
  });
}
