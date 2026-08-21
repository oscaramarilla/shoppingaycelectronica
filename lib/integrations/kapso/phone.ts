// ============================================================
// NORMALIZACIÓN DE NÚMEROS DE WHATSAPP
// ------------------------------------------------------------
// CRÍTICO: hay que normalizar IGUAL al sembrar `contactos_conocidos`
// y al consultarlos, o la comparación nunca matchea. Devuelve solo
// dígitos con código de país (Paraguay = 595 por defecto).
// ============================================================

const PY_CODE = '595';

/** Normaliza un WhatsApp a solo dígitos con código país. */
export function normalizeWhatsapp(raw: string): string {
  let digits = String(raw ?? '').replace(/\D/g, '');
  // Quita prefijos de discado internacional (00...) y ceros iniciales.
  digits = digits.replace(/^00/, '').replace(/^0+/, '');
  // Móvil local paraguayo típico: 9 dígitos empezando en 9 -> prefijar 595.
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = PY_CODE + digits;
  }
  return digits;
}
