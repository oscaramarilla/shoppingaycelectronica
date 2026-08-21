// ============================================================
// POST /api/integrations/kapso/contacts/check
// ------------------------------------------------------------
// Responde si un número está en la allow-list `contactos_conocidos`.
// El workflow de Kapso lo usa para auto-responder SOLO a no-agendados.
//
// FAIL-OPEN: si Supabase no está disponible, devuelve known:false
// (el bot engancha al prospecto). Perder un lead es peor que saludar
// a un conocido. El número se normaliza antes de comparar.
// ============================================================

import { NextResponse } from 'next/server';
import { verifyKapsoSecret } from '@/lib/integrations/kapso/auth';
import { contactCheckSchema } from '@/lib/integrations/kapso/schemas';
import { normalizeWhatsapp } from '@/lib/integrations/kapso/phone';
import { getServiceClient } from '@/lib/supabase/server';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const auth = verifyKapsoSecret(req);
  if (!auth.ok) {
    console.error('[contacts/check] Auth rechazada:', auth.reason);
    return json({ ok: false, error: 'unauthorized' }, auth.status);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = contactCheckSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }

  const whatsapp = normalizeWhatsapp(parsed.data.whatsapp);

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[contacts/check] Supabase no configurado — fail-open.');
    return json({ ok: true, known: false, degraded: true }, 200);
  }

  try {
    const { data, error } = await supabase
      .from('contactos_conocidos')
      .select('id')
      .eq('whatsapp', whatsapp)
      .maybeSingle();

    if (error) {
      console.error('[contacts/check] Error de Supabase:', error.message);
      return json({ ok: true, known: false, degraded: true }, 200);
    }
    return json({ ok: true, known: Boolean(data) }, 200);
  } catch (err) {
    console.error('[contacts/check] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: true, known: false, degraded: true }, 200);
  }
}
