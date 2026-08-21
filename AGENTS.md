# Reglas de Orquestación para Agentes de IA en shoppingaycelectronica

ESTE ARCHIVO ES DE LECTURA OBLIGATORIA ANTES DE INICIAR CUALQUIER TAREA.

## 1. Fuente de Verdad
* El repositorio oficial es `C:\Users\User\Documents\shoppingaycelectronica`.
* El estado actual del proyecto, credenciales (nombres, no valores), URLs de
  webhooks y el contrato de los endpoints viven en `docs/ESTADO.md`. Revisalo
  siempre antes de sugerir cambios en la infraestructura.
* El plan y la arquitectura por fases viven en `docs/PLAN.md`.

## 2. Flujo de Trabajo Multi-Agente
* **Una Rama = Un Feature = Un Agente:** No trabajes en paralelo con otros agentes
  sobre los mismos archivos.
* **Handoffs Obligatorios:** Al terminar una sesión, actualizá `docs/ESTADO.md`
  con un resumen de lo que lograste y lo que quedó pendiente para el siguiente agente.
* **No hacer `git add -A`:** Commiteá únicamente los archivos relevantes a tu tarea
  específica. Respetá los archivos untracked de otras sesiones.
* **Revisá el estado antes de construir:** si lo que te piden ya existe, decilo en
  vez de duplicarlo.

## 3. Arquitectura y Vendor Lock-in (Largo Plazo)
* **Independencia:** La lógica de negocio pesada (registro de pedidos, chequeo de
  contactos, cálculo de cotizaciones) vive en nuestros propios endpoints
  (`/api/...`) en Vercel/Supabase, NO en las funciones propietarias de Kapso o n8n.
* **Secretos:** la `SUPABASE_SERVICE_ROLE_KEY` vive SOLO en Vercel. Kapso solo
  conoce `KAPSO_WEBHOOK_SECRET` para autenticar sus webhooks contra nuestros endpoints.
* **Precios:** nunca hardcodeados en prompts ni de memoria. Se cotiza desde el
  **catálogo propio** (Fase 2+), nunca por scraping en vivo de la competencia.

## 4. Puente Web-Local (Integración con Extensiones)
* El humano (Oscar) usa extensiones de Chrome (ChatGPT/Claude) para operar Vercel,
  Supabase, Kapso, etc.
* Las decisiones tomadas en la web (nuevas URLs, esquemas de BD, secretos) se
  documentan en `docs/ESTADO.md`.
* Tu trabajo como agente local es leer esa documentación y escribir el código que
  conecte nuestra app con esa infraestructura externa.

## 5. Producto (visión)
Este sistema está pensado para **productizarse y venderse como SaaS a otros centros
comerciales**. Mantené la arquitectura limpia, multi-tenant-friendly y sin acoplar
la lógica a datos de un solo cliente.
