-- =============================================================================
-- business-profiles-schema — modelo relacional de Fase 1 (PROPUESTA)
-- =============================================================================
-- ⚠️ PROPUESTA PARA REVISIÓN — NO EJECUTAR todavía. Se entrega para aprobar el
--    diseño antes de correr ninguna migración (pedido de Oscar/Codex, Fase 0).
--
-- Todo acá es ADITIVO: crea tablas nuevas y NO toca las columnas actuales de
-- `units` (tenant_name, monthly_rent, expensa, beneficiario, canal_alquiler).
-- Por eso el panel y el frontend actuales siguen funcionando sin cambios. La
-- baja de esas columnas desnormalizadas es un paso POSTERIOR (ver "CUTOVER").
--
-- -----------------------------------------------------------------------------
-- POR QUÉ ESTE MODELO (el problema que resuelve)
-- -----------------------------------------------------------------------------
-- Hoy `units` está DESNORMALIZADA: mezcla el salón FÍSICO con el inquilino, el
-- alquiler y el beneficiario. Los negocios que ocupan VARIOS salones (Jihad Ali
-- 5, Federico 2, Guebara 2, Zully sus 9) se modelan con un hack: el alquiler se
-- carga en el salón principal y los demás quedan en NULL. Eso funciona, pero:
--   - Cada salón "sabe" de dinero (acopla lo físico con lo comercial/contable).
--   - El alquiler de un contrato queda partido entre filas.
--   - Es la raíz de la confusión NULL-vs-0 (un salón agrupado "parece" gratis).
--
-- La normalización mueve el dinero al CONTRATO, no al salón:
--   unit (físico)  ──occupancy_units──  occupancy (contrato)  ──►  billing_account
--                                              │
--                                              └──►  business_profile (marca pública)
--
--   - El alquiler vive UNA vez, en `occupancies.monthly_rent`.
--   - Un contrato agrupa N salones vía `occupancy_units` (Jihad Ali = 1
--     occupancy con 5 units). No hay más "cargar en el principal y NULLear el
--     resto": el problema NULL/0 DESAPARECE porque el salón ya no tiene alquiler.
--   - Un salón vacante simplemente NO tiene occupancy. Cero ambigüedad.
--   - `beneficiario` (ayc/zully) se vuelve una entidad real: `billing_account`.
--   - `business_profiles` = la MARCA pública (separada del nombre legal privado).
--
-- Correr (cuando se apruebe) DESPUÉS de directorio-cobros.sql. Idempotente.
-- RLS activo en todas (deny-anon; solo service role). El auto-RLS también cubre.
-- =============================================================================


-- ── billing_accounts — quién COBRA el alquiler ───────────────────────────────
-- Reemplaza el enum `beneficiario`. 'AYC' = el padre (entra en su cartera);
-- 'Zully' = la tía (herencia; cartera aparte). Es una entidad para poder sumar,
-- excluir y reportar por cuenta sin filtrar por un string mágico.
create table if not exists public.billing_accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,          -- 'AYC' | 'Zully' | ...
  kind        text,                          -- 'propietario' | 'heredero' | ...
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists billing_accounts_set_updated_at on public.billing_accounts;
create trigger billing_accounts_set_updated_at before update on public.billing_accounts
  for each row execute function public.set_updated_at();

alter table public.billing_accounts enable row level security;

-- Datos de referencia (seguros de sembrar; no son PII).
insert into public.billing_accounts (name, kind) values
  ('AYC',   'propietario'),
  ('Zully', 'heredero')
on conflict (name) do nothing;


-- ── business_profiles — la MARCA comercial PÚBLICA ───────────────────────────
-- Lo que ve el directorio B2C. `display_name`/`whatsapp_public` son PÚBLICOS;
-- `legal_name` es PRIVADO (solo admin) y NUNCA se proyecta al público. Un perfil
-- solo aparece en el sitio cuando status='published' (tras relevamiento +
-- autorización del comercio). Hasta entonces vive en 'draft'.
create table if not exists public.business_profiles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,      -- URL pública /locales/<slug>
  display_name    text not null,             -- marca comercial (PÚBLICO)
  legal_name      text,                      -- nombre legal (PRIVADO)
  category        text,
  whatsapp_public text,                      -- número comercial público (opt-in)
  description     text,
  status          text not null default 'draft'
                    check (status in ('draft', 'published')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_business_profiles_status on public.business_profiles (status);

drop trigger if exists business_profiles_set_updated_at on public.business_profiles;
create trigger business_profiles_set_updated_at before update on public.business_profiles
  for each row execute function public.set_updated_at();

alter table public.business_profiles enable row level security;


-- ── occupancies — el CONTRATO de alquiler (la normalización clave) ───────────
-- El alquiler y la expensa viven ACÁ, una sola vez por contrato — no por salón.
-- monthly_rent/expensa son NULLABLE (NULL = a confirmar / sin cargar), nunca 0.
create table if not exists public.occupancies (
  id                  uuid primary key default gen_random_uuid(),
  billing_account_id  uuid not null references public.billing_accounts(id) on delete restrict,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  status              text not null default 'active'
                        check (status in ('active', 'ended')),
  monthly_rent        integer,               -- guaraníes; NULL = sin cargar (NO 0)
  expensa             integer,               -- guaraníes; NULL = sin cargar
  canal_alquiler      text check (canal_alquiler in ('directo', 'propisur')),
  start_date          date,
  end_date            date,                  -- NULL = contrato vigente
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_occupancies_billing on public.occupancies (billing_account_id);
create index if not exists idx_occupancies_profile on public.occupancies (business_profile_id);
create index if not exists idx_occupancies_status  on public.occupancies (status);

drop trigger if exists occupancies_set_updated_at on public.occupancies;
create trigger occupancies_set_updated_at before update on public.occupancies
  for each row execute function public.set_updated_at();

alter table public.occupancies enable row level security;


-- ── occupancy_units — qué salones ocupa cada contrato (N:N) ───────────────────
-- Así un contrato agrupa varios salones (Jihad Ali: 1 occupancy, 5 units).
-- ON DELETE CASCADE en occupancy (si se borra el contrato, se sueltan los links)
-- pero RESTRICT en unit (un salón con historial no se borra; se cambia de estado).
create table if not exists public.occupancy_units (
  occupancy_id  uuid not null references public.occupancies(id) on delete cascade,
  unit_id       uuid not null references public.units(id)       on delete restrict,
  created_at    timestamptz not null default now(),
  primary key (occupancy_id, unit_id)
);
create index if not exists idx_occupancy_units_unit on public.occupancy_units (unit_id);

-- INVARIANTE DE NEGOCIO: un salón no puede estar en dos contratos ACTIVOS a la
-- vez. Postgres no lo expresa fácil entre tablas con un simple UNIQUE; se
-- propone un índice único parcial sobre una columna derivada `is_active` en
-- occupancy_units mantenida por trigger, O validarlo en el endpoint admin al
-- crear/editar un contrato. Se deja como decisión de implementación de Fase 1.

alter table public.occupancy_units enable row level security;


-- =============================================================================
-- PLAN DE MIGRACIÓN (fuera de este archivo — para acordar en el PR)
-- -----------------------------------------------------------------------------
-- A. ADITIVO (este archivo): crear las 4 tablas. No rompe nada; el panel actual
--    sigue leyendo units.monthly_rent como hoy.
--
-- B. BACKFILL (script aparte, revisado): derivar contratos de los datos vivos
--    de `units`:
--      1. billing_accounts: 'AYC' y 'Zully' ya sembradas arriba.
--      2. Agrupar units ocupadas por (tenant_name, beneficiario). Cada grupo =
--         1 occupancy con el monthly_rent/expensa del salón que lo tiene cargado
--         (el resto del grupo aporta sus units al mismo occupancy vía
--         occupancy_units). canal_alquiler se copia. business_profile_id = NULL
--         (hasta el relevamiento). billing_account_id según beneficiario.
--      3. Verificar: SUM(occupancies.monthly_rent WHERE billing='AYC') debe dar
--         ₲ 20.814.094 y con expensa ₲ 24.484.094 (mismo total que hoy).
--
-- C. CUTOVER (Codex, frontend): el panel pasa a leer cobros desde `occupancies`
--    (join a units por occupancy_units) en vez de units.monthly_rent. El total
--    del padre = occupancies de billing_account 'AYC' activas; Zully aparte por
--    billing_account (ya no por el string beneficiario). Payments debería pasar
--    a referenciar occupancy_id en vez de unit_id (Fase 1.1).
--
-- D. LIMPIEZA (migración posterior, solo tras el cutover): dropear de `units`
--    las columnas desnormalizadas (tenant_name, monthly_rent, expensa,
--    beneficiario, canal_alquiler, phone, due_day). units queda como el salón
--    FÍSICO puro (code, floor, status). NO hacer esto hasta que el frontend ya
--    no las lea, o rompe el panel.
--
-- ROLLBACK (de este archivo aditivo):
--   drop table if exists public.occupancy_units;
--   drop table if exists public.occupancies;
--   drop table if exists public.business_profiles;
--   drop table if exists public.billing_accounts;
-- =============================================================================
