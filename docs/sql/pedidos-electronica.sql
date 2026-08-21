-- =============================================================================
-- pedidos_electronica — pedidos capturados por el bot de WhatsApp
-- =============================================================================
-- Lo escribe POST /api/integrations/kapso/pedidos (upsert idempotente).
-- La state-machine y los campos de seguimiento existen desde el día 1 para que
-- un AGENTE IA AUTÓNOMO tome el follow-up sin migración (Fase 4).
-- Correr UNA vez en Supabase (SQL Editor). Idempotente.
-- =============================================================================

create table if not exists public.pedidos_electronica (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  -- Idempotencia del webhook de Kapso
  source            text default 'kapso',
  conversation_id   text,
  message_id        text,

  -- Contacto
  whatsapp          text,
  nombre            text,

  -- Pedido
  producto          text,
  marca_modelo      text,
  cantidad          integer,
  urgencia          text,      -- alta | media | baja
  entrega           text,      -- zona | retiro | envío
  resumen           text,

  -- Pipeline de ventas (state machine)
  estado            text default 'nuevo',   -- nuevo|contactado|cotizado|negociando|ganado|perdido
  asignado_a        text,                    -- 'humano:<id>' | 'agente-ia' | null
  lead_score        integer,                 -- 0-100

  -- Seguimiento autónomo (lo lee/escribe el agente IA)
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  follow_up_count   integer default 0,
  follow_up_max     integer default 4,
  transcript        jsonb,
  metadata          jsonb
);

-- Clave idempotente del webhook. NULLs son distintos en Postgres, así que filas
-- sin (source, conversation_id, message_id) no colisionan entre sí.
create unique index if not exists uq_pedidos_electronica_idem
  on public.pedidos_electronica (source, conversation_id, message_id);

-- Cola del agente de follow-up.
create index if not exists idx_pedidos_electronica_follow_up
  on public.pedidos_electronica (estado, next_follow_up_at);

alter table public.pedidos_electronica enable row level security;

-- =============================================================================
-- ROLLBACK:
-- drop table if exists public.pedidos_electronica;
-- =============================================================================
