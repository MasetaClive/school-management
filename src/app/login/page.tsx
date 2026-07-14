'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ identifier: '', password: '' });

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { identifier, password } = form;

      const isEmail = identifier.includes('@');
      let userId: string | null = null;

      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
        if (error) throw error;
        userId = data.user?.id ?? null;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${identifier}@school.local`,
          password,
        });
        if (error) {
          throw error;
        }
        userId = data.user?.id ?? null;
      }

      if (userId) {
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
      setError(
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              value={form.identifier}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, identifier: e.target.value }))
              }
              placeholder="student_id, teacher_id, parent_id, or email"
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Students/Teachers/Parents: use your ID. Admins: use email.
        </p>
      </div>
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
