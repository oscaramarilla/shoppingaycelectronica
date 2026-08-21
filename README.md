# shoppingaycelectronica

Marketplace de electrónica (AYC Electrónica S.R.L. · Mercado 4) con **WhatsApp
automático** y catálogo optimizado para SEO/GEO.

- **Plan y arquitectura:** [`docs/PLAN.md`](docs/PLAN.md)
- **Reglas para agentes de IA:** [`AGENTS.md`](AGENTS.md) — lectura obligatoria
- **Estado / torre de control:** [`docs/ESTADO.md`](docs/ESTADO.md)

## Stack

Next.js (App Router) · Supabase (server-side, service role) · Kapso (WhatsApp).

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm test` — tests (Vitest)
- `npm run typecheck` — chequeo de tipos

## Fase 1 (este scaffold)

Endpoints seguros para Kapso:
- `POST /api/integrations/kapso/contacts/check` — allow-list de contactos agendados.
- `POST /api/integrations/kapso/pedidos` — captura idempotente de pedidos.

Autenticados con `KAPSO_WEBHOOK_SECRET` (timing-safe), Supabase con service role
solo del lado del servidor. El frontend del directorio (MVP de Codex) se integra
a continuación.
