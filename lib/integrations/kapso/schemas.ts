// ============================================================
// SCHEMAS ZOD — payloads de los webhooks de Kapso
// ============================================================

import { z } from 'zod';

// ── /contacts/check ─────────────────────────────────────────
export const contactCheckSchema = z.object({
  whatsapp: z.string().trim().min(5).max(30),
});
export type ContactCheckInput = z.infer<typeof contactCheckSchema>;

// ── /pedidos ────────────────────────────────────────────────
// Idempotencia: source + conversationId + messageId (los inyecta el
// webhook de Kapso desde su envelope; el LLM no los conoce).
//
// Campos de negocio: `.nullish()` (aceptan ausente O null). El agente LLM
// suele emitir `null` para lo que la persona no dijo; con `.optional()` a
// secas un `null` haría rebotar TODO el payload con 422. Con `.nullish()`
// el pedido entra igual y el campo queda null en la tabla.
export const pedidoSchema = z.object({
  whatsapp: z.string().trim().min(5).max(30),
  nombre: z.string().trim().max(200).nullish(),
  producto: z.string().trim().min(1).max(300),
  marcaModelo: z.string().trim().max(200).nullish(),
  cantidad: z.number().int().positive().max(100000).nullish(),
  urgencia: z.enum(['alta', 'media', 'baja']).nullish(),
  entrega: z.string().trim().max(200).nullish(),
  resumen: z.string().trim().max(4000).nullish(),
  leadScore: z.number().int().min(0).max(100).nullish(),
  conversationId: z.string().trim().min(1).max(200),
  messageId: z.string().trim().min(1).max(200),
  status: z.string().trim().max(60).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  /** Origen; default 'kapso'. Parte de la clave idempotente. */
  source: z.string().trim().min(1).max(60).default('kapso'),
});
export type PedidoInput = z.infer<typeof pedidoSchema>;

// ── /inquiries (alquiler / comerciante) ─────────────────────
// El bot rutea: producto -> /pedidos; alquiler y comerciante -> acá.
// Mismo criterio de idempotencia (source + conversationId + messageId,
// inyectados por Kapso) y de `.nullish()` que pedidos. `kind` restringido a
// las dos consultas que caen acá; `producto` se rechaza para forzar la ruta a
// /pedidos. `resumen` (obligatorio) se persiste como `inquiries.message`.
export const inquiryKapsoSchema = z.object({
  whatsapp: z.string().trim().min(5).max(30),
  kind: z.enum(['alquiler', 'comerciante']),
  nombre: z.string().trim().max(200).nullish(),
  resumen: z.string().trim().min(1).max(4000),
  conversationId: z.string().trim().min(1).max(200),
  messageId: z.string().trim().min(1).max(200),
  status: z.string().trim().max(60).nullish(),
  /** Origen; default 'kapso'. Parte de la clave idempotente. */
  source: z.string().trim().min(1).max(60).default('kapso'),
});
export type InquiryKapsoInput = z.infer<typeof inquiryKapsoSchema>;
