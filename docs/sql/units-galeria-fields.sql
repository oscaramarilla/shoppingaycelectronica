-- =============================================================================
-- units-galeria-fields — campos del relevamiento REAL de la galería (2026-08-27)
-- =============================================================================
-- Correr en el SQL Editor DESPUÉS de directorio-cobros.sql. Idempotente.
-- Agrega a `units` lo que apareció en los datos reales de la secretaría:
--   - expensa: expensa mensual, SEPARADA del alquiler (se cobra aparte).
--   - beneficiario: quién recibe el alquiler.
--       'ayc'   = lo cobra el padre (entra en los cobros del panel).
--       'zully' = lo recibe la tía Zully por herencia familiar; NO entra en los
--                 cobros del padre (informativo).
--   - canal_alquiler: cómo se alquiló / quién consigue el inquilino.
--       'directo' = el padre directo · 'propisur' = inmobiliaria Propisur · null = a confirmar.
--
-- Nota: `monthly_rent` (ya existe) y `expensa` van en guaraníes (integer).
-- RLS ya está activo en `units`; auto-RLS cubre cualquier tabla futura.
-- =============================================================================

alter table public.units
  add column if not exists expensa        integer,
  add column if not exists beneficiario   text default 'ayc',
  add column if not exists canal_alquiler text;

-- =============================================================================
-- ROLLBACK:
-- alter table public.units
--   drop column if exists expensa,
--   drop column if exists beneficiario,
--   drop column if exists canal_alquiler;
-- =============================================================================
