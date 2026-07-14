import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/'];
const PROTECTED_NAMESPACES = ['/admin', '/teacher', '/student', '/parent'];

const roleRouteMap: Record<string, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};

export async function middleware(request: NextRequest) {
  const { user, role, supabaseResponse } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );

  if (isPublic) {
    if (user && pathname === '/') {
      const redirect = getRedirectForRole(role);
      if (redirect) return NextResponse.redirect(new URL(redirect, request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const redirect = new URL('/login', request.url);
    redirect.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirect);
  }

  const isInProtectedNamespace = PROTECTED_NAMESPACES.some((ns) =>
    pathname.startsWith(ns)
  );

  if (isInProtectedNamespace) {
    if (!role) {
      const redirect = new URL('/login', request.url);
      redirect.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirect);
    }

    const allowedNamespace = roleRouteMap[role];
    if (allowedNamespace && !pathname.startsWith(allowedNamespace)) {
      const redirectTarget = getRedirectForRole(role);
      if (redirectTarget) {
        return NextResponse.redirect(new URL(redirectTarget, request.url));
      }
    }
  }

  return supabaseResponse;
}

function getRedirectForRole(role: string | null): string | null {
  if (!role) return null;
  const map: Record<string, string> = {
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard',
  };
  return map[role] ?? null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
