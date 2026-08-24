// ============================================================
// /api/admin/payments — listar cobros y registrar/generar (upsert). Protegido.
// ============================================================

import { requireUser } from '@/lib/admin/guard';
import { getServiceClient } from '@/lib/supabase/server';
import { paymentUpsertSchema } from '@/lib/admin/schemas';
import { json } from '@/lib/http';

const PAYMENT_COLUMNS =
  'id, unit_id, period, amount, status, paid_on, method, created_at, updated_at';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { searchParams } = new URL(req.url);
  let query = supabase.from('payments').select(PAYMENT_COLUMNS);
  const period = searchParams.get('period');
  const status = searchParams.get('status');
  const unitId = searchParams.get('unit_id');
  if (period) query = query.eq('period', period);
  if (status) query = query.eq('status', status);
  if (unitId) query = query.eq('unit_id', unitId);

  const { data, error } = await query.order('period', { ascending: false });
  if (error) {
    console.error('[admin/payments] GET', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  return json({ ok: true, payments: data ?? [] }, 200);
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
  const parsed = paymentUpsertSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { data, error } = await supabase
    .from('payments')
    .upsert(parsed.data, { onConflict: 'unit_id,period', ignoreDuplicates: false })
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[admin/payments] POST', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  return json({ ok: true, id: data?.id ?? null }, 200);
}
