// ============================================================
// Guard de administración — exige usuario autenticado.
// ------------------------------------------------------------
// Segunda línea de defensa (el middleware es la primera). Todo
// endpoint /api/admin/* llama a requireUser() antes de operar.
// ============================================================

import type { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { json } from '@/lib/http';

export type GuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export async function requireUser(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: json({ ok: false, error: 'unauthorized' }, 401) };
  }
  return { ok: true, userId: user.id };
}
