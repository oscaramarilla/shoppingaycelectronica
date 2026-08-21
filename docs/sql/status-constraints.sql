-- =============================================================================
-- status-constraints — CHECK de los enums confirmados por Codex
-- =============================================================================
-- Correr DESPUÉS de docs/sql/directorio-cobros.sql. Idempotente (drop+add).
-- Valores confirmados del MVP de Codex:
--   units.status      : occupied | available | reserved | maintenance
--   payments.status   : paid | due | overdue
--   inquiries.kind    : alquiler | producto | comerciante
--   inquiries.status  : new | contacted | closed  (lifecycle definido por nosotros;
--                       Codex hoy solo emite 'new'. Ajustar si el panel usa otros.)
-- =============================================================================

alter table public.units drop constraint if exists units_status_chk;
alter table public.units add constraint units_status_chk
  check (status in ('occupied', 'available', 'reserved', 'maintenance'));

alter table public.payments drop constraint if exists payments_status_chk;
alter table public.payments add constraint payments_status_chk
  check (status in ('paid', 'due', 'overdue'));

alter table public.inquiries drop constraint if exists inquiries_kind_chk;
alter table public.inquiries add constraint inquiries_kind_chk
  check (kind in ('alquiler', 'producto', 'comerciante'));

alter table public.inquiries drop constraint if exists inquiries_status_chk;
alter table public.inquiries add constraint inquiries_status_chk
  check (status in ('new', 'contacted', 'closed'));

-- =============================================================================
-- ROLLBACK:
-- alter table public.units      drop constraint if exists units_status_chk;
-- alter table public.payments   drop constraint if exists payments_status_chk;
-- alter table public.inquiries  drop constraint if exists inquiries_kind_chk;
-- alter table public.inquiries  drop constraint if exists inquiries_status_chk;
-- =============================================================================
