# DEPLOY — shoppingaycelectronica

Runbook para dejar el sitio online en el dominio, con el marketplace y el panel
funcionando. Servicios: **dominio** (Squarespace) → **hosting** (Vercel) →
**base de datos + auth** (Supabase, proyecto PROPIO del shopping).

## 1. Dominio (Squarespace → Vercel)
- En Squarespace → tu dominio → **DNS**, apuntá a Vercel con los valores EXACTOS
  que muestra **"Ver configuración de DNS"** en Vercel (típicamente `A @` → IP de
  Vercel, `CNAME www` → cname del proyecto). Borrá el `A @` de parking de Squarespace.
- En Vercel, los 3 dominios deben quedar en ✅ **"Configuración válida"**.

## 2. Supabase (proyecto PROPIO del shopping)
- Crear un proyecto **nuevo** (separado del de aycweb), región cercana (São Paulo / East US).
- SQL Editor → correr **en este orden** (de `docs/sql/`):
  1. `directorio-cobros.sql` (units, payments, inquiries + trigger updated_at)
  2. `status-constraints.sql` (CHECK de los enums)
  3. `contactos-conocidos.sql` (allow-list de WhatsApp)
  4. `pedidos-electronica.sql` (captura de pedidos)
- (Opcional para la demo) sembrar unos locales de ejemplo con un `insert into units ...`.
- Copiar de **Project Settings → API**: `Project URL`, `anon` key, `service_role` key.

## 3. Env vars en Vercel (entorno Production)
| Variable | Valor |
|---|---|
| `SUPABASE_URL` | el Project URL |
| `SUPABASE_ANON_KEY` | la anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | la service_role (SECRETA) |
| `SITE_URL` | `https://www.shoppingaycelectronica.com` |
| `KAPSO_WEBHOOK_SECRET` | una cadena aleatoria larga |

Ninguna con prefijo `NEXT_PUBLIC_`. La `service_role` **nunca** se expone al cliente.

## 4. ⚠️ REDEPLOY (crítico)
Las env vars **solo aplican a builds nuevos**. Después de cargarlas, hacé
**Redeploy** del último deploy de `main` (Deployments → `...` → Redeploy, **sin
caché**). Sin esto, el sitio sigue sin ver Supabase: `/login` y `/gestion` no
funcionan y el marketplace sale vacío.

## 5. Usuarios admin (MANUAL — no delegar a un agente)
Supabase → **Authentication → Users → Add user**: email + contraseña para el padre
de Oscar y cada secretario/cobrador. Son credenciales: las setea el humano.
> Hoy cualquier usuario autenticado = admin total. Si en el futuro hace falta
> diferenciar (cobrador solo ve/marca pagos vs admin total), se agrega una tabla
> `profiles` con `role` y un check de rol en `lib/admin/guard.ts`.

## 6. Smoke test
- `/` → marketplace con los locales.
- `/login` → iniciar sesión con un usuario admin.
- `/gestion` → sin sesión redirige a `/login`; con sesión, panel de units/payments/inquiries.
- Cargar un local y un cobro; cambiar el estado de una consulta.

## 7. Kapso / WhatsApp (fase siguiente, aún no)
Proyecto Kapso propio + número dedicado (API-only). Los endpoints
`/api/integrations/kapso/contacts/check` y `/pedidos` ya existen. Arquitectura:
**Modelo B** (endpoints inteligentes nuestros; el agente conversacional a futuro
en nuestra app con Groq + API de Meta). Ver `docs/PLAN.md`.
