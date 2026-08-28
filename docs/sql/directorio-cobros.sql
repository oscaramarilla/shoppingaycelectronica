-- =============================================================================
-- directorio-cobros — units, payments, inquiries (MVP del directorio + cobros)
-- =============================================================================
-- Adaptación del esquema de Codex a los estándares de este proyecto (Postgres/
-- Supabase). Correr UNA vez en el SQL Editor. Idempotente. Orden importa:
-- `units` antes que `payments` (FK).
--
-- DECISIONES DE CTO (respecto del esquema original de Codex, que era SQLite):
--   1. PKs UUID (`gen_random_uuid()`), consistente con el resto del repo
--      (contactos_conocidos, pedidos_electronica). El identificador HUMANO de un
--      local sigue siendo `units.code` (único). Para el frontend: tratar `id`
--      como opaco y usar `code` para mostrar/buscar; al importar los datos de
--      Codex hay que mapear sus ids de texto a estos UUID.
--   2. Timestamps `created_at` + `updated_at` (timestamptz) en las tres tablas;
--      `updated_at` lo mantiene el trigger `set_updated_at()`.
--   3. Montos en GUARANÍES como `integer` (sin decimales; entra holgado en int4 y
--      se serializa como number para el frontend). Igual criterio que Codex.
--   4. `status` (units, payments, inquiries) queda TEXT SIN CHECK todavía: no
--      conocemos el enum exacto que usa el frontend de Codex. Confirmados los
--      valores reales, se ajusta con un CHECK. Los comentarios listan los esperados.
--   5. Inquilino DESNORMALIZADO dentro de `units` (tenant_name/phone/category),
--      igual que Codex, para no romper su frontend. Un modelo `tenants` propio
--      (un inquilino con varios locales) queda como normalización de Fase 2.
--   6. FK `payments.unit_id -> units.id` con **ON DELETE RESTRICT** (ver nota).
--
-- ON DELETE RESTRICT (decisión pedida por Oscar):
--   Se elige RESTRICT (no SET NULL) para PROTEGER el historial contable: no se
--   puede borrar un local que tenga pagos. Vaciar un local es un CAMBIO DE ESTADO
--   (`units.status = 'vacante'`), NO un DELETE. SET NULL dejaría pagos huérfanos
--   sin local asociado, lo que rompe la contabilidad. Si algún día hay que
--   eliminar un local, primero se decide qué hacer con sus pagos, a mano.
--
-- RLS: activo en las tres. Las políticas se definen al integrar el frontend:
--   - `units`: lectura pública (directorio B2C).
--   - `inquiries`: alta vía endpoint server-side (no insert anónimo directo).
--   - `payments`: solo admin/servicio (panel de cobros B2B).
-- =============================================================================

-- Función compartida para mantener updated_at en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── units — locales del shopping (con inquilino desnormalizado) ───────────────
create table if not exists public.units (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,               -- identificador humano ("A-12")
  floor         text not null,
  status        text not null,                      -- ocupado | vacante | reservado (confirmar enum de Codex)
  tenant_name   text,
  phone         text,
  category      text,
  monthly_rent  integer,                             -- guaraníes; NULL = sin alquiler propio (vacante / combinado en el salón principal / lo cobra Zully). NO usar 0 (0 = "gratis").
  due_day       integer not null default 10 check (due_day between 1 and 31),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_units_floor_status on public.units (floor, status);

drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at before update on public.units
  for each row execute function public.set_updated_at();

alter table public.units enable row level security;

-- ── payments — cobros mensuales por local ────────────────────────────────────
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references public.units(id) on delete restrict,
  period      text not null,                        -- 'YYYY-MM'
  amount      integer not null,                     -- guaraníes
  status      text not null,                        -- pendiente | pagado | vencido (confirmar enum de Codex)
  paid_on     date,
  method      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists idx_payments_unit_period_unique on public.payments (unit_id, period);
create index if not exists idx_payments_status_period on public.payments (status, period);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- ── inquiries — consultas del directorio B2C / B2B ───────────────────────────
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,                        -- p.ej. producto | local | b2b (confirmar enum de Codex)
  name        text not null,
  phone       text not null,
  message     text not null,
  status      text not null default 'new',          -- new | contacted | closed (confirmar enum de Codex)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_inquiries_status_created on public.inquiries (status, created_at);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

alter table public.inquiries enable row level security;

-- =============================================================================
-- ROLLBACK:
-- drop table if exists public.payments;
-- drop table if exists public.inquiries;
-- drop table if exists public.units;
-- drop function if exists public.set_updated_at();
-- =============================================================================
