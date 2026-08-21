// ============================================================
// AUTENTICACIÓN DE WEBHOOKS KAPSO
// ------------------------------------------------------------
// Los endpoints /api/integrations/kapso/* exigen el header
// `x-kapso-webhook-secret` y lo comparan (timing-safe) contra
// KAPSO_WEBHOOK_SECRET. El secreto NUNCA se loguea.
// ============================================================

import { timingSafeEqual } from 'crypto';

export const KAPSO_SECRET_HEADER = 'x-kapso-webhook-secret';

export type KapsoAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; reason: string };

/** Compara dos strings en tiempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifica el secreto del webhook de Kapso.
 * - 500 si el servidor no tiene el secreto configurado.
 * - 401 si el header falta o no coincide.
 * No revela el valor esperado ni el recibido.
 */
export function verifyKapsoSecret(req: Request): KapsoAuthResult {
  const expected = process.env.KAPSO_WEBHOOK_SECRET;
  if (!expected) {
    return {
      ok: false,
      status: 500,
      reason: 'KAPSO_WEBHOOK_SECRET no está configurado en el servidor.',
    };
  }
  const received = req.headers.get(KAPSO_SECRET_HEADER);
  if (!received || !safeEqual(received, expected)) {
    return { ok: false, status: 401, reason: 'Secreto de webhook inválido o ausente.' };
  }
  return { ok: true };
}
