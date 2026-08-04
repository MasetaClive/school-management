// Next.js only exposes browser-safe environment variables when their names are
// referenced directly. Dynamic access (process.env[name]) leaves these values
// unavailable in client components such as the login page.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

export function getSupabaseBrowserEnv() {
  const url = supabaseUrl;
  const anonKey = supabaseAnonKey;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey };
}

export function getSupabaseServerEnv() {
  const url = supabaseUrl;
  const anonKey = supabaseAnonKey;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const url = supabaseUrl;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin access is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { url, serviceRoleKey };
}
