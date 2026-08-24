// ============================================================
// Supabase Auth (server-side, @supabase/ssr)
// ------------------------------------------------------------
// Cliente ligado a las cookies de sesión para IDENTIFICAR al
// usuario (anon key + cookies). NO se usa para leer/escribir
// datos: eso lo hace el cliente service-role (lib/supabase/server).
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/** Crea el cliente Supabase ligado a las cookies de la request. */
export async function createServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Invocado desde un Server Component: el refresh de cookies lo hace
          // el middleware. Se ignora sin romper.
        }
      },
    },
  });
}

/** Devuelve el usuario autenticado, o null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
