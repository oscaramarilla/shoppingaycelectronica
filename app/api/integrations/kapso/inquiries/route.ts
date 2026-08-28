// ============================================================
// POST /api/integrations/kapso/inquiries
// ------------------------------------------------------------
// Registra una consulta de ALQUILER o COMERCIANTE capturada por el
// agente de Kapso. Las de PRODUCTO van a /pedidos. NO resuelve ni
// re-clasifica: solo persiste. Idempotente por
// (source, conversation_id, message_id).
//
// Seguridad: header x-kapso-webhook-secret; service role solo en el
// servidor; no loguea secretos. Si Supabase falla, error controlado.
// ============================================================

import { NextResponse } from 'next/server';
import { verifyKapsoSecret } from '@/lib/integrations/kapso/auth';
import { inquiryKapsoSchema } from '@/lib/integrations/kapso/schemas';
import { normalizeWhatsapp } from '@/lib/integrations/kapso/phone';
import { getServiceClient } from '@/lib/supabase/server';

const TABLE = 'inquiries';
const CONFLICT_TARGET = 'source,conversation_id,message_id';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const auth = verifyKapsoSecret(req);
  if (!auth.ok) {
    console.error('[inquiries-kapso] Auth rechazada:', auth.reason);
    return json({ ok: false, error: 'unauthorized' }, auth.status);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = inquiryKapsoSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }
  const c = parsed.data;

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[inquiries-kapso] Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    return json({ ok: false, error: 'storage_unavailable' }, 503);
  }

  const now = new Date().toISOString();
  const row = {
    source: c.source,
    conversation_id: c.conversationId,
    message_id: c.messageId,
    kind: c.kind,
    name: c.nombre ?? null,
    phone: normalizeWhatsapp(c.whatsapp),
    message: c.resumen,
    status: c.status ?? 'new',
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: CONFLICT_TARGET, ignoreDuplicates: false })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[inquiries-kapso] Error de Supabase:', error.message);
      return json({ ok: false, error: 'storage_error' }, 502);
    }
    return json({ ok: true, id: data?.id ?? null, idempotencyKey: CONFLICT_TARGET }, 200);
  } catch (err) {
    console.error('[inquiries-kapso] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
}
