// ============================================================
// GET /api/units — directorio público de locales
// ------------------------------------------------------------
// Proyección SEGURA (sin tenant_name / monthly_rent / due_day / phone). Lectura
// server-side con service role. Filtros: floor, status, category, q.
// ============================================================

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { unitsQuerySchema } from '@/lib/directory/schemas';
import { UNIT_PUBLIC_COLUMNS, type UnitPublic } from '@/lib/directory/types';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = unitsQuerySchema.safeParse({
    floor: searchParams.get('floor') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    q: searchParams.get('q') ?? undefined,
  });
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }
  const f = parsed.data;

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[units] Supabase no configurado.');
    return json({ ok: false, error: 'storage_unavailable' }, 503);
  }

  // Filtros primero, `order` al final (el filter builder mantiene .eq/.ilike).
  let query = supabase.from('units').select(UNIT_PUBLIC_COLUMNS);
  if (f.floor) query = query.eq('floor', f.floor);
  if (f.status) query = query.eq('status', f.status);
  if (f.category) query = query.eq('category', f.category);
  // Hasta que existan business_profiles autorizados, la búsqueda pública se
  // limita al código del salón. El nombre legal jamás se consulta públicamente.
  if (f.q) query = query.ilike('code', `%${f.q}%`);

  try {
    const { data, error } = await query.order('code', { ascending: true });
    if (error) {
      console.error('[units] Error de Supabase:', error.message);
      return json({ ok: false, error: 'storage_error' }, 502);
    }
    return json({ ok: true, units: (data ?? []) as unknown as UnitPublic[] }, 200);
  } catch (err) {
    console.error('[units] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
}
