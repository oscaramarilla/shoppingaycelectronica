import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function deny(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  // Redirect to localized login
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(/^\/(es|en|pt)/);
  const locale = match ? match[1] : routing.defaultLocale;
  const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 1. Auth protection for /gestion, /admin, /api/admin
  if (pathname.includes('/gestion') || pathname.includes('/admin') || pathname.startsWith('/api/admin')) {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) return deny(request);

    let response = NextResponse.next({ request });
    
    // Si no es API, pasamos por next-intl para tener el locale en la URL
    if (!pathname.startsWith('/api/')) {
      response = intlMiddleware(request);
    }

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return deny(request);
    return response;
  }

  // 2. Default i18n routing for public pages
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(es|en|pt)/:path*',
    '/gestion/:path*',
    '/admin/:path*',
    '/api/admin/:path*'
  ],
};
