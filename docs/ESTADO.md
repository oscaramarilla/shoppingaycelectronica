# Estado Actual de shoppingaycelectronica y Torre de Control

## 1. Infraestructura Activa
* **Frontend/Backend:** Vercel (Next.js) — repo separado de AYCweb.
* **Base de Datos:** Supabase (proyecto PROPIO, separado).
* **WhatsApp:** Kapso, número **dedicado API-only** (no coexistencia).
* **Objetivo:** productizable como SaaS para otros shoppings.

## 2. Últimas Actualizaciones Web (Handoffs de Extensiones Chrome)
*(Humano: pegar aquí los resúmenes de configuraciones hechas en la web.)*
* **[FECHA]:** (ejemplo) Se creó el proyecto Supabase y se cargaron las env vars en Vercel.

## 3. Variables de Entorno (.env.local — solo nombres, nunca valores)
*(Server-side únicamente. Ninguna con prefijo `NEXT_PUBLIC_`.)*
* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `SITE_URL`
* `ADMIN_USER`
* `ADMIN_PASS`
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

## 5. Tareas Pendientes (WIP)
* [ ] Adquirir la línea nueva y conectarla a Kapso (API-only).
* [ ] Crear proyecto Supabase + cargar env vars en Vercel + correr los SQL de `docs/sql/`.
* [ ] Generar `KAPSO_WEBHOOK_SECRET` (Vercel + Kapso).
* [ ] Sembrar `contactos_conocidos` con el export de contactos de Oscar.
* [x] **Frontend de Codex portado a Next.js App Router**: portada B2C, buscador,
      directorio seguro de locales y panel de cobros B2B sobre Supabase server-side.
* [x] Protección HTTP Basic para `/gestion` y `/api/admin/*`; actualización de
      cobros mediante `PATCH /api/admin/payments/[id]` con UUID opaco y Zod.
* [ ] Integrar/mergear el PR de endpoints públicos (`GET /api/units` y
      `POST /api/inquiries`) antes de validar el formulario en producción.
* [ ] Armar el workflow de captura en Kapso (draft, número sandbox primero).
