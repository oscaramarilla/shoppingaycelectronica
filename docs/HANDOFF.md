# HANDOFF — Estado del proyecto shoppingaycelectronica

> **Lectura obligatoria para cualquier agente o desarrollador nuevo.** Este
> documento dice "en qué piso del edificio estamos". Complementa `AGENTS.md`
> (reglas), `docs/PLAN.md` (visión), `docs/DEPLOY.md` (deploy) y `docs/ESTADO.md`
> (torre de control). Última actualización: **2026-08-26**.

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
     privado) → solo admin.
   - `business_profiles` = **público** (marca, WhatsApp público, catálogo).
   - Ningún endpoint público expone alquiler, teléfono privado ni nombre legal
     (proyecciones "seguras", ver `lib/directory/types.ts`).
3. **Auth:** Supabase Auth (`@supabase/ssr`). `proxy.ts` protege `/gestion/*`,
   `/admin/*`, `/api/admin/*`; cada endpoint admin revalida con `requireUser()`.
4. **RLS activo + 0 políticas** = deny para anon; solo `service_role` pasa. Es
   **intencional**. Más un **event trigger de auto-RLS** para tablas futuras.
5. **Idempotencia** en webhooks de Kapso por `(source, conversation_id, message_id)`.
6. **Disciplina:** un feature = una rama = un PR = un agente. Tests con Vitest +
   `npm run build` en verde como puerta antes de cada merge. Nunca `git add -A`.

## 5. Qué se construyó (PRs #1–#9, todos mergeados a `main`)
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

## 6. Estado actual (la foto)
| Componente | Estado |
|---|---|
| Dominio + HTTPS | ✅ Vivo |
| Frontend desplegado | ✅ Marketplace visible; **concepto validado por el dueño** |
| Supabase (proyecto) | ✅ Creado, Healthy, São Paulo (`ref rkjxrnjlynslkohvltkc`) |
| **Migraciones (4 SQL)** | ⏳ **Sin correr** (a correr en SQL Editor) |
| **Env vars en Vercel** | ⏳ Sin cargar |
| Auto-RLS trigger | ⏳ Aprobado, a correr |
| Integración GitHub de Supabase | ⚠️ Apunta al repo equivocado (`aycelectronica`) → **desconectar** |
| Redeploy | ⏳ Después de env vars |
| Usuarios admin | ⏳ Los crea Oscar en Supabase Auth |

> El sitio está online y el concepto validado, pero **el panel aún no funciona de
> verdad** hasta conectar la base (migraciones + llaves + redeploy).

## 7. Pendiente para cerrar el deploy (HOY)
1. Correr el **event trigger de auto-RLS** + las **4 migraciones** (orden: lo único
   que importa es `directorio-cobros.sql` **antes** de `status-constraints.sql`).
2. Cargar **env vars** en Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, `KAPSO_WEBHOOK_SECRET`.
3. **Desconectar** la integración GitHub de Supabase (repo equivocado).
4. **Redeploy** sin caché.
5. Crear **usuarios admin** (Supabase → Authentication → Users → Add user, con
   "Auto Confirm").
6. Validar `/gestion` en vivo.

## 8. Pendiente para MAÑANA (datos reales)
- Llenar las 4 plantillas CSV de `docs/` (`locales-inquilinos`, `perfiles-comerciales`,
  `ofertas`, `fotos`).
- Crear tablas nuevas (`business_profiles`, `catalog_items`, `profile_photos`,
  `leads`), mapear por `unit_code`, subir fotos a Supabase Storage, armar
  `/locales/[slug]` reales, sacar la data demo (sin dejar contenido ficticio indexado).
- Sección **"AYC Empresas"** con links UTM a los 4 dominios.

## 9. Decisiones clave
- **Modelo B**; agente conversacional futuro con **Groq + API de Meta** en nuestra app.
- **Supabase propio**, **São Paulo**, plan **Free por ahora → Pro antes de producción real**.
- **Catálogo propio**, no scraping.
- **Roles:** hoy cualquier autenticado = admin total; roles (cobrador vs admin) = fase futura.

## 10. Ecosistema AYC (4 negocios)
`metalmadeas.com` (mobiliario escolar) · `oriplastpy.com` (rep de plásticos de
Brasil) · `ayc.com.py` (fabricación/licitaciones) · `aycweb.com` (agentes/IA).
El Shopping es la puerta de entrada que deriva demanda a cada uno con links UTM.
