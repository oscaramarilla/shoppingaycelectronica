// ============================================================
// POST /api/integrations/kapso/pedidos
// ------------------------------------------------------------
// Registra un pedido de electrónica ya capturado por el agente de
// Kapso. NO cotiza ni re-clasifica: solo persiste. Idempotente por
// (source, conversation_id, message_id).
//
// Seguridad: header x-kapso-webhook-secret; service role solo en el
// servidor; no loguea secretos. Si Supabase falla, error controlado.
// ============================================================

import { NextResponse } from 'next/server';
import { verifyKapsoSecret } from '@/lib/integrations/kapso/auth';
import { pedidoSchema } from '@/lib/integrations/kapso/schemas';
import { normalizeWhatsapp } from '@/lib/integrations/kapso/phone';
import { getServiceClient } from '@/lib/supabase/server';

const TABLE = 'pedidos_electronica';
const CONFLICT_TARGET = 'source,conversation_id,message_id';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const auth = verifyKapsoSecret(req);
  if (!auth.ok) {
    console.error('[pedidos] Auth rechazada:', auth.reason);
    return json({ ok: false, error: 'unauthorized' }, auth.status);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = pedidoSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }
  const p = parsed.data;

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[pedidos] Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    return json({ ok: false, error: 'storage_unavailable' }, 503);
  }

  const now = new Date().toISOString();
  const row = {
    source: p.source,
    conversation_id: p.conversationId,
    message_id: p.messageId,
    whatsapp: normalizeWhatsapp(p.whatsapp),
    nombre: p.nombre ?? null,
    producto: p.producto,
    marca_modelo: p.marcaModelo ?? null,
    cantidad: p.cantidad ?? null,
    urgencia: p.urgencia ?? null,
    entrega: p.entrega ?? null,
    resumen: p.resumen ?? null,
    lead_score: p.leadScore ?? null,
    estado: p.status ?? 'nuevo',
    metadata: p.metadata ?? null,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: CONFLICT_TARGET, ignoreDuplicates: false })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[pedidos] Error de Supabase:', error.message);
      return json({ ok: false, error: 'storage_error' }, 502);
    }
    return json({ ok: true, id: data?.id ?? null, idempotencyKey: CONFLICT_TARGET }, 200);
  } catch (err) {
    console.error('[pedidos] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
}
