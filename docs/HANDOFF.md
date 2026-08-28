# HANDOFF — Estado del proyecto shoppingaycelectronica

> **Lectura obligatoria para cualquier agente o desarrollador nuevo.** Este
> documento dice "en qué piso del edificio estamos". Complementa `AGENTS.md`
> (reglas), `docs/PLAN.md` (visión), `docs/DEPLOY.md` (deploy) y `docs/ESTADO.md`
> (torre de control). Última actualización: **2026-08-28 — SITIO EN VIVO**.

## 1. Qué es el proyecto
Un sitio con **dos caras**:
- **Público (B2C):** directorio/marketplace de los locales del shopping de
  electrónica de AYC en el **Mercado 4 (Asunción)**.
- **Privado (B2B):** panel de administración (`/gestion`) para gestionar
  **locales, alquileres, cobros y consultas**.

Es la primera pieza del **"Ecosistema AYC"** (4 negocios familiares que se
promueven entre sí).

## 2. El equipo
| Quién | Rol |
|---|---|
| Oscar | Dueño / decisiones de negocio |
| Claude | Arquitectura backend, endpoints, seguridad, revisiones, git/PRs |
| Codex | Frontend (marketplace, panel `/gestion`, `/login`) |
| Claude-in-Chrome | Opera los dashboards (Supabase, Vercel) |

## 3. Stack
- **Repo:** `oscaramarilla/shoppingaycelectronica` (privado)
- **App:** Next.js (App Router) → **Vercel**
- **Base de datos + auth:** **Supabase** (proyecto propio, región São Paulo)
- **Dominio:** `shoppingaycelectronica.com` (Squarespace → DNS a Vercel)
- **Futuro:** Kapso (WhatsApp); después Groq + API de Meta para el agente de ventas

## 4. Arquitectura (los principios NO negociables)
1. **Modelo B — acceso a datos server-side.** Nada del navegador toca Supabase
   directo. Las páginas leen con `service_role` en Server Components
   (`lib/domain/data.ts`, `import "server-only"`); las escrituras van por
   endpoints (`/api/...`). La lógica y los datos son nuestros, no del vendor.
2. **Separación de privacidad:**
   - `units` = **privado** (alquiler, vencimiento, inquilino legal, teléfono
     privado) → solo admin. *(Hoy `units` está desnormalizada; el modelo
     relacional de Fase 1 lo separa — ver `ESTADO.md` §7 y
     `docs/sql/business-profiles-schema.sql`.)*
   - `business_profiles` = **público** (marca, WhatsApp público, catálogo).
     Es una tabla **propuesta** en Fase 1, todavía no existe en la base.
   - Ningún endpoint público expone alquiler, teléfono privado ni nombre legal
     (proyecciones "seguras", ver `lib/directory/types.ts`).
3. **Auth:** Supabase Auth (`@supabase/ssr`). `proxy.ts` protege `/gestion/*`,
   `/admin/*`, `/api/admin/*`; cada endpoint admin revalida con `requireUser()`.
4. **RLS activo + 0 políticas** = deny para anon; solo `service_role` pasa. Es
   **intencional**. Más un **event trigger de auto-RLS** para tablas futuras.
5. **Idempotencia** en webhooks de Kapso por `(source, conversation_id, message_id)`.
6. **Disciplina:** un feature = una rama = un PR = un agente. Tests con Vitest +
   `npm run build` en verde como puerta antes de cada merge. Nunca `git add -A`.

## 5. Qué se construyó (PRs #1–#17, todos mergeados a `main`)
| PR | Qué |
|---|---|
| #1 | Scaffold Next.js + endpoints Kapso (`contacts/check`, `pedidos`) + tablas + `AGENTS.md` |
| #2 | Esquema `units`/`payments`/`inquiries` (UUIDs, timestamps, FK `ON DELETE RESTRICT`, guaraníes) |
| #3 | Plan de integración + CHECK de enums |
| #4 | Endpoints públicos `/api/units`, `/api/inquiries` (proyección segura) |
| #5 | Detalle `/api/units/[code]` |
| #6 | Auth admin (Supabase Auth + `proxy.ts`) + endpoints admin (units/payments/inquiries) |
| #7 | Frontend de Codex (marketplace + `/gestion` + `/login`) |
| #8 | Runbook de deploy (`docs/DEPLOY.md`) |
| #9 | Marketplace con perfiles **demo** + `/locales/[slug]` + modelo `business_profiles` + plantillas CSV |
| #10 | Este HANDOFF |
| #11–#13 | Galería real (50 salones) + fix de privacidad (`tenant_name` fuera de la proyección pública) + identidad azul eléctrico |
| #14 | `units.monthly_rent` **nullable** (el seed pasa NULL; `not null default 0` rebotaba con 23502) |
| #15 | `pedidoSchema` `.nullish()` (el LLM emite `null`; `.optional()` lo rechazaba con 422) |
| #16 | Doc: Zully tiene **9** salones, no 8 |
| #17 | Endpoint `POST /api/integrations/kapso/inquiries` (alquiler / comerciante) |

## 6. Estado actual (la foto) — EN VIVO
| Componente | Estado |
|---|---|
| Dominio + HTTPS | ✅ Vivo (`www.shoppingaycelectronica.com`) |
| Sitio público | ✅ **En producción, leyendo la base**; concepto validado por el dueño |
| Supabase (proyecto) | ✅ São Paulo (`ref rkjxrnjlynslkohvltkc`) |
| Migraciones + auto-RLS | ✅ **Corridas y verificadas** |
| Env vars en Vercel | ✅ **Cargadas** (`ANON`/`SERVICE_ROLE` las pegó Oscar) |
| Auth URL Config (Supabase) | ✅ Site URL = dominio real (era `localhost:3000`) |
| Datos reales (`units`) | ✅ **50 salones** (26 PB + 24 PA, 21 libres) |
| Redeploy | ✅ Ready en Production |
| Usuario admin | ✅ Creado (`aycfam@gmail.com`) |
| Bot de WhatsApp (Kapso) | ⛔ **Apagado** — 3 prerrequisitos (ver `ESTADO.md` §6) |

> El sitio está **vivo y funcionando de verdad**: el panel `/gestion` lee cobros
> reales (₲ 24.484.094/mes) y el directorio público muestra los 50 salones. Ver
> el detalle exacto de producción en **`docs/ESTADO.md`** (fuente de verdad).

## 7. Deploy CERRADO — qué sigue
El deploy quedó terminado (llaves + migraciones + redeploy + usuario admin). Lo
pendiente ahora, sin apuro (nada bloquea el sitio):
1. **(Oscar)** Generar los cobros de agosto en `/gestion` y crear usuarios para
   el padre + secretarias.
2. **(Revisión)** Aprobar el modelo relacional de Fase 1
   (`docs/sql/business-profiles-schema.sql`) → backfill → cutover del frontend.
3. **(Deploy)** Correr `docs/sql/inquiries-kapso-idem.sql` para el endpoint
   `/inquiries` (cuando se arme el bot).
4. **(Bot)** Los 3 prerrequisitos de Kapso y el ruteo de webhooks.

## 8. Datos reales de comercios (tras relevamiento)
- Cargar `business_profiles`, productos y fotos **solo** con autorización de cada
  comercio (relevamiento inquilino por inquilino).
- `/locales/[slug]` reales; sacar cualquier data demo (sin contenido ficticio indexado).
- Sección **"AYC Empresas"** con links UTM a los 4 dominios del ecosistema.

## 9. Decisiones clave
- **Modelo B**; agente conversacional futuro con **Groq + API de Meta** en nuestra app.
- **Supabase propio**, **São Paulo**, plan **Free por ahora → Pro antes de producción real**.
- **Catálogo propio**, no scraping.
- **Roles:** hoy cualquier autenticado = admin total; roles (cobrador vs admin) = fase futura.

## 10. Ecosistema AYC (4 negocios)
`metalmadeas.com` (mobiliario escolar) · `oriplastpy.com` (rep de plásticos de
Brasil) · `ayc.com.py` (fabricación/licitaciones) · `aycweb.com` (agentes/IA).
El Shopping es la puerta de entrada que deriva demanda a cada uno con links UTM.
