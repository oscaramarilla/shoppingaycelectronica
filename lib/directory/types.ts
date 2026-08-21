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
  tenant_name: string | null;
  category: string | null;
};

/**
 * Columnas seguras para la proyección pública de `units`.
 * NUNCA incluir monthly_rent, due_day ni phone (financiero / PII).
 */
export const UNIT_PUBLIC_COLUMNS = 'id, code, floor, status, tenant_name, category';
