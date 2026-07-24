'use client';

import { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const nextFieldErrors = {
      identifier: form.identifier.trim()
        ? ''
        : 'Enter your username or email address.',
      password: form.password ? '' : 'Enter your password.',
    };

    if (nextFieldErrors.identifier || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({ identifier: '', password: '' });

    try {
      const { identifier, password } = form;

      const isEmail = identifier.includes('@');
      let userId: string | null = null;
      let forcePasswordChange = false;

      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
        if (error) throw error;
        userId = data.user?.id ?? null;
        forcePasswordChange = data.user?.user_metadata?.force_password_change === true;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${identifier}@school.local`,
          password,
        });
        if (error) {
          throw error;
        }
        userId = data.user?.id ?? null;
        forcePasswordChange = data.user?.user_metadata?.force_password_change === true;
      }

      if (userId) {
        if (forcePasswordChange) {
          router.push('/change-password');
          router.refresh();
          return;
        }
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        const role = userData?.role;
        const rolePath =
          role === 'admin'
            ? '/admin/dashboard'
            : role === 'teacher'
              ? '/teacher/dashboard'
              : role === 'student'
                ? '/student/dashboard'
                : role === 'parent'
                  ? '/parent/dashboard'
                  : redirect;

        router.push(rolePath);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(
        /invalid login credentials/i.test(message)
          ? 'We could not sign you in with those details. Please try again.'
          : message || 'We could not sign you in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function updateIdentifier(identifier: string) {
    setForm((prev) => ({ ...prev, identifier }));
    if (fieldErrors.identifier) {
      setFieldErrors((prev) => ({ ...prev, identifier: '' }));
    }
    if (error) setError(null);
  }

  function updatePassword(password: string) {
    setForm((prev) => ({ ...prev, password }));
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
    if (error) setError(null);
  }

  function togglePasswordVisibility() {
    const input = passwordInputRef.current;
    const selectionStart = input?.selectionStart ?? null;
    const selectionEnd = input?.selectionEnd ?? null;

    setShowPassword((visible) => !visible);
    requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        passwordInputRef.current?.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/10 px-4 py-8 sm:px-6">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-primary/5 sm:p-8"
      >
        <header className="mb-8 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold tracking-tight text-primary-foreground shadow-lg shadow-primary/20"
          >
            SM
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            School Management System
          </p>
          <h1 id="login-heading" className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your school account.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Username or Email
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={form.identifier}
                onChange={(e) => updateIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                aria-invalid={Boolean(fieldErrors.identifier)}
                aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {fieldErrors.identifier && (
              <p id="identifier-error" className="mt-2 text-sm text-destructive" role="alert">
                {fieldErrors.identifier}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                ref={passwordInputRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => updatePassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="m3 3 18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 8.3 4.1 9.5 8-0.5 1.5-1.3 2.9-2.4 4" />
                    <path d="M6.6 6.6C4.7 8 3.3 10 2.5 12c1.2 3.9 4.5 8 9.5 8 1.2 0 2.3-.2 3.3-.6" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-2 text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-4 w-4 animate-spin" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm leading-6 text-muted-foreground">
          Students/Teachers/Parents: use your ID. Admins: use email.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
