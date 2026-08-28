-- =============================================================================
-- inquiries-kapso-idem — captura de consultas del bot (alquiler / comerciante)
-- =============================================================================
-- Correr en el SQL Editor DESPUÉS de directorio-cobros.sql. Idempotente.
--
-- La tabla `inquiries` ya existía para el formulario público del sitio. El bot
-- de WhatsApp (Kapso) captura consultas de ALQUILER y COMERCIANTE; las de
-- PRODUCTO van a `pedidos_electronica` (que tiene sus propios campos). Para que
-- esas consultas caigan estructuradas y sin duplicar, agregamos la clave
-- idempotente del webhook, igual que en pedidos_electronica.
--
--   - source: quién generó la consulta. 'web' = formulario público (default,
--             el único writer que existía), 'kapso' = bot de WhatsApp. Parte de
--             la clave idempotente.
--   - conversation_id / message_id: del envelope de Kapso. NULL para el web.
--   - name pasa a NULLABLE: un lead de WhatsApp puede no dar su nombre y el
--     teléfono lo identifica. El formulario público lo sigue exigiendo en su
--     propio schema (`lib/directory/schemas`), así que no afecta esa entrada.
--
-- NULLs son distintos en Postgres: las filas del web (conversation_id y
-- message_id null) NO colisionan entre sí en el índice único.
--
-- RLS ya está activo en `inquiries`; auto-RLS cubre cualquier tabla futura.
-- =============================================================================

alter table public.inquiries
  add column if not exists source          text default 'web',
  add column if not exists conversation_id text,
  add column if not exists message_id      text;

alter table public.inquiries alter column name drop not null;

create unique index if not exists uq_inquiries_kapso_idem
  on public.inquiries (source, conversation_id, message_id);

-- =============================================================================
-- ROLLBACK:
-- drop index if exists public.uq_inquiries_kapso_idem;
-- -- (solo si ninguna fila tiene name null)
-- alter table public.inquiries alter column name set not null;
-- alter table public.inquiries
--   drop column if exists source,
--   drop column if exists conversation_id,
--   drop column if exists message_id;
-- =============================================================================
