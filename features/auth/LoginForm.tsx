'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/FormField';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { applyServerErrors } from '@/lib/forms/applyServerErrors';
import { ApiError } from '@/lib/api/ApiError';
import { useLogin } from './hooks';

export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Focus the first field on mount so the form is usable without reaching for a mouse.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const { ref: emailFormRef, ...emailField } = register('email');

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login.mutateAsync(values);
    } catch (err) {
      // Field-level problems attach to their input; everything else becomes a banner.
      if (applyServerErrors(err, setError)) return;

      if (err instanceof ApiError) {
        setFormError(
          err.status === 429
            ? 'Too many attempts. Please wait a few minutes and try again.'
            : err.status === 0
              ? 'Could not reach the server. Is the API running?'
              : err.message,
        );
        return;
      }
      setFormError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to the admin portal</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <FormField label="Email" error={errors.email?.message} required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              {...emailField}
              ref={(el) => {
                emailFormRef(el);
                emailRef.current = el;
              }}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          )}
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          {(fieldProps) => (
            <div className="relative">
              <Input
                {...fieldProps}
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting || login.isPending}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
