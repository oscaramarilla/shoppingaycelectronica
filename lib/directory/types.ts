// ============================================================
// Tipos del directorio B2C — proyecciones PÚBLICAS.
// Codex importa `UnitPublic` en sus Server Components.
// ============================================================

/** Proyección pública de un local: SIN campos financieros ni PII. */
export type UnitPublic = {
  id: string;
  code: string;
  floor: string;
  status: string;
  category: string | null;
};

/**
 * Columnas seguras para la proyección pública de `units`.
 * NUNCA incluir tenant_name, monthly_rent, due_day ni phone (PII/financiero).
 * El nombre público del comercio vendrá de business_profiles con autorización.
 */
export const UNIT_PUBLIC_COLUMNS = 'id, code, floor, status, category';
