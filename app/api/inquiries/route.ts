// ============================================================
// POST /api/inquiries — alta de consulta del directorio (público)
// ------------------------------------------------------------
// Validación Zod + insert server-side con service role. Entrada
// pública: se validan longitudes; el rate-limit/honeypot queda como
// endurecimiento futuro.
// ============================================================

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { inquirySchema } from '@/lib/directory/schemas';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_error', issues: parsed.error.issues }, 422);
  }
  const i = parsed.data;

  const supabase = getServiceClient();
  if (!supabase) {
    console.error('[inquiries] Supabase no configurado.');
    return json({ ok: false, error: 'storage_unavailable' }, 503);
  }

  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({ kind: i.kind, name: i.name, phone: i.phone, message: i.message, status: 'new' })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[inquiries] Error de Supabase:', error.message);
      return json({ ok: false, error: 'storage_error' }, 502);
    }
    return json({ ok: true, id: data?.id ?? null }, 200);
  } catch (err) {
    console.error('[inquiries] Error inesperado:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
}
