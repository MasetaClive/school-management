import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerEnv } from '@/lib/supabase/config';

function isAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; status?: number; message?: string };
  const code = candidate.code?.toLowerCase() ?? '';
  const message = candidate.message?.toLowerCase() ?? '';
  const status = candidate.status;

  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    code.includes('refresh') ||
    code.includes('invalid_grant') ||
    code.includes('invalid_token') ||
    message.includes('refresh token') ||
    message.includes('invalid refresh')
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseServerEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(3000),
        });
      },
    },
  });

  let user = null;
  let role: string | null = null;

  try {
    const {
      data: { user: currentUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (!isAuthSessionError(error)) throw error;
    } else {
      user = currentUser;
    }
  } catch {
    user = null;
  }

  if (user) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      role = data?.role ?? null;
    } catch (e) {
      console.error('[supabase middleware] role lookup failed/timed out:', e);
      role = null;
    }
  }

  return { user, role, supabaseResponse };
}
