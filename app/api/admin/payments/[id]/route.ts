// ============================================================
// PATCH /api/admin/payments/[id] — actualizar cobro (marcar pagado). Protegido.
// ============================================================

import { requireUser } from '@/lib/admin/guard';
import { getServiceClient } from '@/lib/supabase/server';
import { paymentUpdateSchema } from '@/lib/admin/schemas';
import { json } from '@/lib/http';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) return json({ ok: false, error: 'invalid_id' }, 400);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = paymentUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }

  // Al marcar pagado sin fecha explícita, se registra hoy.
  const patch: Record<string, unknown> = { ...parsed.data };
  if (patch.status === 'paid' && !patch.paid_on) {
    patch.paid_on = new Date().toISOString().slice(0, 10);
  }

  const supabase = getServiceClient();
  if (!supabase) return json({ ok: false, error: 'storage_unavailable' }, 503);

  const { data, error } = await supabase
    .from('payments')
    .update(patch)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[admin/payments] PATCH', error.message);
    return json({ ok: false, error: 'storage_error' }, 502);
  }
  if (!data) return json({ ok: false, error: 'not_found' }, 404);
  return json({ ok: true, id: data.id }, 200);
}
