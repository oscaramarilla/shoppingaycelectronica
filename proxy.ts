// ============================================================
// Proxy (ex-middleware) — resuelve el idioma de la ruta y protege
// el panel y las APIs admin con Supabase Auth.
//
// Next 16 renombró `middleware.ts` a `proxy.ts`: tener ambos archivos
// rompe el build, así que toda la lógica vive acá.
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlProxy = createMiddleware(routing);

const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`);
const ADMIN_PATH = /^\/(?:gestion|admin)(?:\/|$)/;

function localeOf(pathname: string) {
  return pathname.match(LOCALE_PREFIX)?.[0].slice(1) ?? routing.defaultLocale;
}

function withoutLocale(pathname: string) {
  const stripped = pathname.replace(LOCALE_PREFIX, '');
  return stripped === '' ? '/' : stripped;
}

function isProtected(pathname: string) {
  if (pathname.startsWith('/api/admin')) return true;
  return ADMIN_PATH.test(withoutLocale(pathname));
}

function deny(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  // `localePrefix: 'as-needed'`: el idioma por defecto va sin prefijo.
  const locale = localeOf(pathname);
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const loginUrl = new URL(`${prefix}/login`, request.nextUrl.origin);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (!isProtected(pathname)) {
    return isApi ? NextResponse.next() : intlProxy(request);
  }

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return deny(request);

  // Las páginas protegidas también pasan por i18n; las APIs no tienen idioma.
  const response = isApi ? NextResponse.next({ request }) : intlProxy(request);

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

export const config = {
  // Todo lo que no sea asset estático pasa por i18n, más las APIs admin.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/admin/:path*'],
};
