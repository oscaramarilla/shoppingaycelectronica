// ============================================================
// GET /api/units/[code] — detalle público de un local
// ------------------------------------------------------------
// Misma proyección SEGURA que el listado (sin monthly_rent /
// due_day / phone). Lectura server-side con service role.
// 404 si el `code` no existe.
// ============================================================

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { UNIT_PUBLIC_COLUMNS, type UnitPublic } from '@/lib/directory/types';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const clean = String(code ?? '').trim();
  if (!clean || clean.length > 50) {
    return json({ ok: false, error: 'invalid_code' }, 400);
  }

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[units/code] Supabase no configurado.');
    return json({ ok: false, error: 'storage_unavailable' }, 503);
  }

  try {
    const { data, error } = await supabase
      .from('units')
      .select(UNIT_PUBLIC_COLUMNS)
      .eq('code', clean)
      .maybeSingle();

    if (error) {
      console.error('[units/code] Error de Supabase:', error.message);
      return json({ ok: false, error: 'storage_error' }, 502);
    }
    if (!data) {
      return json({ ok: false, error: 'not_found' }, 404);
    }
    return json({ ok: true, unit: data as unknown as UnitPublic }, 200);
  } catch (err) {
    console.error('[units/code] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
}
