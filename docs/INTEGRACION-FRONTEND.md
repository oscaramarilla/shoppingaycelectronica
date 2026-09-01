# Plan de Integración del Frontend (Codex) — directorio + cobros

Mapa para que Codex inyecte sus componentes React sin pisar la arquitectura limpia.

> ⚠️ **Documento histórico de integración (PRs #1–#7).** El frontend ya está
> integrado y **en producción**. Para el estado real de hoy, ver la fuente de
> verdad: **`docs/ESTADO.md`**. Cambios desde este plan: la proyección pública
> **ya NO incluye `tenant_name`** (PR #12); existe el endpoint
> `POST /api/integrations/kapso/inquiries` (PR #17); y el modelo de datos va
> hacia el relacional de Fase 1 (`docs/sql/business-profiles-schema.sql`:
> `occupancies`/`billing_accounts`/`business_profiles`), donde el alquiler deja
> de vivir en `units`.

## Contexto
- **Stack de Codex: Next.js App Router** (mismo que el nuestro) → es **portar componentes**, no migrar framework.
- Tablas ya definidas (PR #2): `units`, `payments`, `inquiries`. Enums confirmados → CHECK en `docs/sql/status-constraints.sql`.

## Regla de arquitectura (NO negociable)
**Todo acceso a datos pasa por el servidor** (service role). **Nunca** cliente-directo-a-Supabase. RLS queda restrictivo (anon denegado); la interfaz pública son **nuestros endpoints con proyecciones seguras**.

- **Páginas SSR/SSG** (directorio B2C, panel B2B): leen directo con `getServiceClient()` en Server Components. Sin fetch desde el cliente.
- **Mutaciones y escrituras públicas**: vía Route Handlers con validación Zod + service role.
- **Proyección pública vs admin**: los endpoints públicos **NUNCA** devuelven campos financieros ni PII (`tenant_name`/nombre legal, `monthly_rent`, `expensa`, `beneficiario`, `due_day`, `phone` del inquilino). Esos son solo admin.

## Enums confirmados (CHECK)
| Tabla | Campo | Valores |
|---|---|---|
| units | status | occupied · available · reserved · maintenance |
| payments | status | paid · due · overdue |
| inquiries | kind | alquiler · producto · comerciante |
| inquiries | status | new · contacted · closed *(lifecycle nuestro)* |

## Mapa de endpoints

### Públicos (directorio B2C)
| Método | Ruta | Qué | Devuelve (proyección segura) |
|---|---|---|---|
| GET | `/api/units` | directorio, filtros `floor`/`status`/`category`/`q` | code, floor, status, category *(SIN `tenant_name` — PR #12)* |
| GET | `/api/units/[code]` | detalle de un local | idem (sin nombre legal ni datos financieros) |
| POST | `/api/inquiries` | alta de consulta (Zod: kind, name, phone, message) | `{ ok, id }` |

> Las páginas del directorio pueden leer `units` en Server Components directo; `GET /api/units` es para filtrado client-side o consumo externo.
> `phone` NO se expone por defecto (posible PII). Exponerlo solo si es un número comercial público confirmado.

### Admin (panel de cobros B2B) — protegidos
| Método | Ruta | Qué |
|---|---|---|
| GET | `/api/admin/units` | units completos (con rent, due_day, phone) |
| POST | `/api/admin/units` | crear local / asignar inquilino |
| PATCH | `/api/admin/units/[id]` | editar (status, rent, due_day, inquilino) |
| GET | `/api/admin/payments` | cobros (filtros `period`/`status`/`unit_id`) |
| POST | `/api/admin/payments` | generar/registrar cobro (upsert por `unit_id`+`period`) |
| PATCH | `/api/admin/payments/[id]` | marcar pagado (status, paid_on, method) |
| GET | `/api/admin/inquiries` | bandeja de consultas |
| PATCH | `/api/admin/inquiries/[id]` | cambiar status (new→contacted→closed) |

**Protección admin:** Supabase Auth con `@supabase/ssr`. `proxy.ts` refresca la
sesión y protege `/gestion/*`, `/admin/*` y `/api/admin/*`; los Route Handlers
también revalidan con `requireUser()`. Los endpoints usan service role únicamente
después de autenticar la sesión y validan mutaciones con Zod.

## Estructura de archivos (dónde va cada cosa)
```
app/(directorio)/...      páginas públicas B2C (Server Components leen units)
app/login/...             inicio de sesión por correo y contraseña
app/gestion/...           panel B2B (protegido)
app/api/units/            GET público
app/api/inquiries/        POST público
app/api/admin/...         endpoints admin (units, payments, inquiries)
components/...            componentes React de Codex
lib/domain/...            tipos + lógica (units, payments, inquiries)
lib/integrations/kapso/   (ya existe) auth, schemas, phone
lib/supabase/server.ts    (ya existe) getServiceClient()
```

## Migración de datos de Codex
- **ids TEXT → UUID:** al importar, generar UUID nuevos y **mapear las FK** (`payments.unit_id`) por el `code` del local. `code` es la clave estable para el mapeo.
- Montos en **guaraníes** (integer, sin decimales).

## Reglas para Codex (una rama, sin pisarnos)
- Trabajar en **su propia rama** desde un `main` con PR #1 y #2 ya mergeados.
- Los componentes consumen **endpoints / Server Components**, nunca Supabase directo.
- `id` es opaco → usar `code` para mostrar/buscar.
- No commitear secretos; `.env.local` local.

## Orden sugerido
1. Merge de PR #1, #2 y este (CHECK constraints + plan).
2. Codex trae componentes + páginas en su rama (desde main).
3. Nosotros creamos los endpoints de este mapa y cableamos.
4. Migramos su data (mapeo de ids por `code`).
5. Protección admin + revisión de políticas RLS.
