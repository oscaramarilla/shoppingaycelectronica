-- =============================================================================
-- contactos_conocidos — allow-list de números agendados
-- =============================================================================
-- El bot auto-responde SOLO a números que NO estén acá. Se consulta desde
-- POST /api/integrations/kapso/contacts/check.
--
-- CRÍTICO: la columna `whatsapp` guarda el número NORMALIZADO (solo dígitos con
-- código país, ver lib/integrations/kapso/phone.ts). Sembrar y consultar SIEMPRE
-- con el mismo criterio de normalización.
-- Correr UNA vez en Supabase (SQL Editor). Idempotente.
-- =============================================================================

create table if not exists public.contactos_conocidos (
  id          uuid primary key default gen_random_uuid(),
  whatsapp    text unique not null,   -- normalizado: 595...
  nombre      text,
  categoria   text,                   -- familia | amigo | cliente | proveedor | ...
  fuente      text,                   -- import | manual | auto
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_contactos_conocidos_whatsapp
  on public.contactos_conocidos (whatsapp);

-- Seguridad: RLS activo. El backend usa service role (bypassa RLS); la anon key
-- no puede leer la lista.
alter table public.contactos_conocidos enable row level security;

-- =============================================================================
-- ROLLBACK:
-- drop table if exists public.contactos_conocidos;
-- =============================================================================
