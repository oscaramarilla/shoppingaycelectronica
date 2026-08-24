// ============================================================
// /api/admin/units — listar (completo) y crear locales. Protegido.
// ============================================================

import { requireUser } from '@/lib/admin/guard';
import { getServiceClient } from '@/lib/supabase/server';
import { unitCreateSchema } from '@/lib/admin/schemas';
import { json } from '@/lib/http';

const ADMIN_UNIT_COLUMNS =
  'id, code, floor, status, tenant_name, phone, category, monthly_rent, due_day, created_at, updated_at';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { data, error } = await supabase
    .from('units')
    .select(ADMIN_UNIT_COLUMNS)
    .order('code', { ascending: true });
  if (error) {
    console.error('[admin/units] GET', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  return json({ ok: true, units: data ?? [] }, 200);
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = unitCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { data, error } = await supabase
    .from('units')
    .insert(parsed.data)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[admin/units] POST', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  return json({ ok: true, id: data?.id ?? null }, 201);
}
