// ============================================================
// Cliente Supabase server-side (service role) — SOLO servidor.
// La service role bypasea RLS para poder insertar/leer desde los
// endpoints. NUNCA se expone al cliente (sin NEXT_PUBLIC_).
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Devuelve un cliente con service role, o `null` si falta configuración.
 * El caller decide qué hacer ante `null` (fail-open en check, 503 en pedidos).
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
