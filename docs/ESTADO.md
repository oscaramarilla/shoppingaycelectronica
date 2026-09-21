# Estado Actual de shoppingaycelectronica — Torre de Control

> **Fuente de verdad operativa. Última actualización: 2026-09-07.**
> Refleja la realidad EXACTA de producción. Si algo acá contradice a otro doc,
> manda este. Todo agente/LLM lee esto y `AGENTS.md` antes de tocar nada.

## 0. Titular

**EL SITIO ESTÁ EN VIVO Y LEYENDO LA BASE REAL.**
`https://www.shoppingaycelectronica.com` — deploy Ready en Production (Vercel),
conectado a Supabase, con los **50 salones reales** cargados. Concepto validado
por el padre de Oscar. El **panel `/gestion` funciona** (usuario admin creado).
El **bot de WhatsApp NO está encendido** (ver §6, freno de mano).

## 1. Infraestructura Activa

* **Frontend/Backend:** Next.js (App Router) en **Vercel**, repo separado de AYCweb.
* **Base de datos + Auth:** **Supabase** propio (proyecto `rkjxrnjlynslkohvltkc`,
  región São Paulo). RLS activo en todas las tablas + **event trigger de auto-RLS**
  para tablas futuras. 0 políticas = deny-anon; solo `service_role` pasa (intencional).
* **Dominio:** `www.shoppingaycelectronica.com` (Squarespace → DNS a Vercel), HTTPS.
* **WhatsApp:** Kapso. ⚠️ **Realidad hoy: conexión Coexistence** sobre el número
  personal de Oscar `+595 985 864209` (el mismo tráfico personal/comercial). El
  **plan** es una línea dedicada API-only, pero **todavía no existe**. Ver §6.
* **Objetivo de mediano plazo:** productizable como SaaS para otros shoppings.

## 2. Estado por componente (la foto)

| Componente | Estado |
|---|---|
| Dominio + HTTPS | ✅ Vivo |
| Sitio público (directorio, 50 salones, GEO) | ✅ En producción, leyendo la base |
| Supabase (migraciones, RLS, auto-RLS) | ✅ Corridas y verificadas |
| Env vars en Vercel (5) | ✅ Cargadas (`ANON`/`SERVICE_ROLE` las pegó Oscar) |
| Supabase Auth URL Config | ✅ Site URL = dominio real (era `localhost:3000`) |
| Datos reales (`units`) | ✅ 50 salones (26 PB + 24 PA, 21 libres) |
| Panel `/gestion` | ✅ Vivo; usuario admin `aycfam@gmail.com` creado |
| Identidad visual | ✅ Azul eléctrico + fachada + dirección + teléfono |
| Sección "Grupo AYC" (2do piso) | ✅ 4 empresas con logo, copy y link (falta el logo de Oriplast) |
| Contexto de consultas + disponibilidad pública | 🚧 PR `codex/contextual-inquiries`: conserva salón/producto/búsqueda, añade WhatsApp y deriva vacancias desde `units`; pendiente de revisión y deploy |
| Telemetría Vercel (Web Analytics + Speed Insights) | 🚧 Rama `chore/vercel-telemetry-a11y`: paquetes `@vercel/analytics` y `@vercel/speed-insights` en `app/layout.tsx`. **Antes de esto el sitio no enviaba datos**, aunque Web Analytics figurara activo en el panel. Sin datos hasta el deploy |
| Bot de WhatsApp (Kapso) | ⛔ **Apagado** — faltan 3 prerrequisitos (§6) |
| Modelo relacional Fase 1 | 📐 Propuesto (`business-profiles-schema.sql`), sin ejecutar |

## 3. Cómo se cargaron los datos reales (IMPORTANTE)

Los 50 salones se sembraron con un **`INSERT` SQL manual** en el SQL Editor, que
usa **`NULL`** para el alquiler sin cargar (salones vacantes, agrupados en el
principal, y los de Zully). **`monthly_rent` es NULLABLE** (PR #14) — un `NULL`
significa "sin alquiler propio", nunca 0.

⚠️ **El script `scripts/import-locales-reales.mjs` (`npm run data:import:units`)
NO fue el que cargó producción.** Hasta este PR tenía un bug (`monthly_rent`
usaba `integerOrZero` → convertía vacíos en 0); si se corría, sobrescribía los
`NULL` correctos con `0`. Ya se corrigió a `nullableInteger`. Aun así, es una
herramienta legacy: producción se maneja por SQL, y el modelo va hacia
`occupancies` (§7), donde el alquiler ni vive en `units`.

**Números de referencia (verificados contra el CSV y la base):**
| Concepto | Valor |
|---|---|
| Salones totales / disponibles | 50 / 21 |
| Zully (cartera aparte) | 9 |
| Ocupados AYC con alquiler cargado | 14 |
| Ocupados AYC agrupados (`monthly_rent` NULL) | 6 |
| Total cobros AYC / mes (alquiler + expensa) | **₲ 24.484.094** |

## 4. Variables de Entorno (Vercel — solo nombres, nunca valores)

*(Server-side únicamente. Ninguna con prefijo `NEXT_PUBLIC_`.)*
* `SUPABASE_URL` ✅ · `SUPABASE_ANON_KEY` ✅ · `SUPABASE_SERVICE_ROLE_KEY` ✅
* `SITE_URL` ✅ (`https://www.shoppingaycelectronica.com`)
* `KAPSO_WEBHOOK_SECRET` ⚠️ creada **vacía** (no la necesita el sitio/panel; sí
  el webhook del bot cuando se arme — mismo valor en Kapso y Vercel).
* `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID` — para cuando se cablee Kapso.

## 5. Contrato de los Webhooks (Kapso → App)

Auth en todos: header `x-kapso-webhook-secret` == `KAPSO_WEBHOOK_SECRET` (timing-safe).
Idempotencia por `(source, conversation_id, message_id)`. `conversationId`/`messageId`
los inyecta el envelope de Kapso (el LLM no los conoce). Ver `lib/integrations/kapso/schemas.ts`.

| Ruta | Qué | Campos clave |
|---|---|---|
| `POST /api/integrations/kapso/contacts/check` | allow-list; fail-open | `{ whatsapp } → { known }` |
| `POST /api/integrations/kapso/pedidos` | consulta de **producto** → `pedidos_electronica` | `whatsapp, producto, conversationId, messageId` (req.) |
| `POST /api/integrations/kapso/inquiries` | consulta de **alquiler / comerciante** → `inquiries` (PR #17) | `whatsapp, kind, resumen, conversationId, messageId` (req.); rechaza `producto` con 422 |

**Ruteo del bot:** producto → `/pedidos`; alquiler o comerciante → `/inquiries`.
Campos opcionales `.nullish()` (el LLM emite `null` para lo que no capturó).

## 6. Bot de WhatsApp — apagado, con FRENO DE MANO

**No encender hasta cumplir los 3 prerrequisitos.** El artifact del prompt está
listo y verificado contra el código (contrato de salida en camelCase).

1. **Allow-list vacía + Coexistence = le contesta a tu familia.** El bot
   auto-responde a quien **no** esté en `contactos_conocidos`; hoy esa tabla
   tiene 0 filas y el número es el personal de Oscar. Cargar los contactos
   conocidos (familia, clientes) **antes** de encender.
2. **Agente real, no sandbox.** El número está atado a un agente Sandbox; el
   proyecto Kapso muestra "No agents yet". Crear el agente real antes de pegar
   el prompt, o se edita el sandbox.
3. **Webhook + secret.** Configurar el/los webhook(s) a los endpoints de §5 con
   el header `x-kapso-webhook-secret` = `KAPSO_WEBHOOK_SECRET` (generar el valor
   con `openssl rand -hex 32`, mismo valor en Kapso y Vercel).

## 7. Modelo de datos — hoy y hacia dónde va

**Hoy:** `units` está **desnormalizada** (mezcla salón físico + inquilino +
alquiler + beneficiario). Los negocios con varios salones se modelan cargando el
alquiler en el salón principal y NULLeando el resto. Funciona, pero acopla lo
físico con lo comercial/contable.

**Fase 1 (propuesto, sin ejecutar — `docs/sql/business-profiles-schema.sql`):**
normalizar en `billing_accounts` (quién cobra: AYC / Zully), `occupancies`
(el contrato: el alquiler vive acá, una vez), `occupancy_units` (un contrato →
N salones) y `business_profiles` (marca pública, separada del nombre legal). El
alquiler sale de `units` → **el problema NULL/0 desaparece**. Ver el plan de
migración (aditivo → backfill → cutover del frontend → limpieza) en ese archivo.

## 8. Acceso y contrato administrativo

* `/login`: correo + contraseña de Supabase Auth; sesión en cookies `httpOnly`
  vía `@supabase/ssr`. Cualquier usuario autenticado = admin total (roles
  cobrador/admin = fase futura).
* `proxy.ts` protege `/gestion/*`, `/admin/*`, `/api/admin/*`; los Route Handlers
  revalidan con `requireUser()`.
* El panel consulta `GET /api/admin/units`, `GET /api/admin/payments?period=YYYY-MM`,
  `GET /api/admin/inquiries?status=new`; muta con `POST /api/admin/payments`
  (upsert mensual), `PATCH /api/admin/payments/[id]`, `PATCH /api/admin/inquiries/[id]`.
* **Cobros = alquiler + expensa**; Zully excluida del total del padre; vista de
  vacancias (21) para el embudo "Quiero alquilar".

## 9. Historia (PRs mergeados a `main`)

`#1`–`#6` backend (endpoints Kapso, esquema units/payments/inquiries, auth admin)
· `#7` frontend de Codex · `#8` runbook de deploy · `#9` perfiles demo + modelo
· `#10` HANDOFF · `#11`–`#13` galería real + privacidad + identidad azul ·
`#14` `monthly_rent` nullable · `#15` `pedidoSchema` `.nullish()` · `#16` conteo
Zully (9) · `#17` endpoint `/inquiries` · `#18` fuente de verdad + integridad de
datos · `#19` páginas públicas `/locales` y `/categorias` · `#20` sección
"Grupo AYC" en la portada (publicidad cruzada de las 4 empresas del 2do piso).

## 10. Tareas Pendientes (WIP)

* [ ] **(Deploy)** Tras mergear `chore/vercel-telemetry-a11y`: confirmar en Vercel →
      Analytics y Speed Insights que llegan visitas reales (los scripts
      `/_vercel/insights/*` y `/_vercel/speed-insights/*` solo existen dentro de
      Vercel; en local dan 404). Los Web Vitals de campo tardan semanas en juntar
      volumen; hoy PageSpeed no tiene datos CrUX.
* [ ] **(Coordinación PR #22 i18n)** Ese PR borra `app/layout.tsx` y crea
      `app/[locale]/layout.tsx`. Al mergear, mover `<Analytics />` y
      `<SpeedInsights />` (más sus dos imports) al `<body>` del layout nuevo.
* [ ] **(Frontend)** Contraste WCAG en `/locales/*` y `/categorias/*`: quedan 4
      nodos por página en `app/marketplace-pages.module.css` (`.trustStrip span`
      `#c2daff` y `.conversionBand p` `#d1e3ff` sobre `#0066ff`, ~3,4–3,7:1;
      en categorías además `.businessCardArt small` y `.categoryLinks`). La portada
      `/` ya cumple 4,5:1 (medido con axe-core, mobile y escritorio).

* [ ] **(Revisión / deploy)** Revisar y mergear `codex/contextual-inquiries`: la portada debe conservar el contexto de salón, producto o búsqueda en el formulario; ofrecer WhatsApp cuando no haya resultados; y mostrar conteos/códigos de vacancias desde `units`, no desde constantes. No publica perfiles, productos, fotos ni precios sin autorización.
* [ ] **(Oscar)** Tocar "Generar 14 cobros" en `/gestion` para arrancar el
      tracking de agosto (₲ 24.484.094).
* [ ] **(Oscar)** Crear usuarios para el padre + secretarias (igual que
      `aycfam@gmail.com`; ahora la Site URL manda los mails al dominio real).
* [ ] **(Revisión)** Aprobar `business-profiles-schema.sql` → luego backfill →
      cutover del frontend (Codex) → limpieza de columnas desnormalizadas.
* [ ] **(Deploy)** Correr `docs/sql/inquiries-kapso-idem.sql` en la BD viva
      (para el endpoint `/inquiries`). No urgente: el bot está apagado.
* [ ] **(Bot)** Los 3 prerrequisitos de §6, y cablear el ruteo de webhooks.
* [ ] **(Oscar)** Adquirir la línea dedicada API-only (o cargar
      `contactos_conocidos` si se sigue con Coexistence).
* [ ] Cargar `business_profiles`, productos y fotos **solo** tras el relevamiento
      y autorización de cada comercio.
* [ ] **(Oscar)** Pasar el logo de Oriplast PY. `oriplastpy.com` no publica uno
      propio (su sitio usa el de Metal Mad), así que la tarjeta muestra un
      wordmark tipográfico. Para activarlo: dejar el archivo en
      `public/images/grupo-ayc/` y apuntar `logo` en
      `lib/directory/group-companies.ts`.
