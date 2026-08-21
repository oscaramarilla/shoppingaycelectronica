# Estado Actual de shoppingaycelectronica y Torre de Control

## 1. Infraestructura Activa
* **Frontend/Backend:** Vercel (Next.js) — repo separado de AYCweb.
* **Base de Datos:** Supabase (proyecto PROPIO, separado).
* **WhatsApp:** Kapso, número **dedicado API-only** (no coexistencia).
* **Objetivo:** productizable como SaaS para otros shoppings.

## 2. Últimas Actualizaciones Web (Handoffs de Extensiones Chrome)
* **2026-08-24:** Backend público y administrativo integrado. El panel usa
  Supabase Auth (`@supabase/ssr`), pantalla `/login` y endpoints privados.

## 3. Variables de Entorno (.env.local — solo nombres, nunca valores)
*(Server-side únicamente. Ninguna con prefijo `NEXT_PUBLIC_`.)*
* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `SITE_URL`
* `KAPSO_API_KEY`
* `KAPSO_PHONE_NUMBER_ID`
* `KAPSO_WEBHOOK_SECRET`

## 4. Contrato de los Webhooks (Kapso → App)
Auth en ambos: header `x-kapso-webhook-secret` == `KAPSO_WEBHOOK_SECRET` (timing-safe).

### `POST /api/integrations/kapso/contacts/check`
Body `{ whatsapp }` → `{ ok, known }`. Consulta `contactos_conocidos`.
**Fail-open:** si Supabase no está disponible, devuelve `known:false` (el bot
engancha al prospecto). El número se normaliza antes de comparar.

### `POST /api/integrations/kapso/pedidos`
Registra un pedido calificado en `pedidos_electronica`. Idempotente por
`(source, conversation_id, message_id)`. Requeridos: `whatsapp`, `producto`,
`conversationId`, `messageId`. Ver `lib/integrations/kapso/schemas.ts`.

## 5. Acceso y contrato administrativo
* `/login`: correo + contraseña de Supabase Auth; la sesión se guarda en cookies
  `httpOnly` administradas por `@supabase/ssr`.
* `proxy.ts`: protege `/gestion/*`, `/admin/*` y `/api/admin/*`.
* El panel consulta únicamente `GET /api/admin/units`,
  `GET /api/admin/payments?period=YYYY-MM` y
  `GET /api/admin/inquiries?status=new`.
* Mutaciones conectadas: `POST /api/admin/payments` (upsert mensual),
  `PATCH /api/admin/payments/[id]` y `PATCH /api/admin/inquiries/[id]`.

## 6. Tareas Pendientes (WIP)
* [ ] Adquirir la línea nueva y conectarla a Kapso (API-only).
* [ ] Crear proyecto Supabase + cargar env vars en Vercel + correr los SQL de `docs/sql/`.
* [ ] Generar `KAPSO_WEBHOOK_SECRET` (Vercel + Kapso).
* [ ] Sembrar `contactos_conocidos` con el export de contactos de Oscar.
* [x] **Frontend de Codex portado a Next.js App Router**: portada B2C, buscador,
      directorio seguro de locales y panel B2B conectado a los endpoints oficiales.
* [x] Supabase Auth, login, cierre de sesión y protección de panel/APIs.
* [x] Endpoints públicos (`GET /api/units`, `GET /api/units/[code]` y
      `POST /api/inquiries`) integrados en `main`.
* [ ] Armar el workflow de captura en Kapso (draft, número sandbox primero).
