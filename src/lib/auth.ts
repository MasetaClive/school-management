import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types';

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

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (!isAuthSessionError(error)) throw error;
    return null;
  }

  if (!user) return null;
  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (!isAuthSessionError(error)) throw error;
    return null;
  }

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data?.role as UserRole) ?? null;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (!isAuthSessionError(error)) throw error;
    return null;
  }

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
