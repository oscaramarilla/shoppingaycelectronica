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
// Idempotencia: source + conversationId + messageId.
export const pedidoSchema = z.object({
  whatsapp: z.string().trim().min(5).max(30),
  nombre: z.string().trim().max(200).optional(),
  producto: z.string().trim().min(1).max(300),
  marcaModelo: z.string().trim().max(200).optional(),
  cantidad: z.number().int().positive().max(100000).optional(),
  urgencia: z.enum(['alta', 'media', 'baja']).optional(),
  entrega: z.string().trim().max(200).optional(),
  resumen: z.string().trim().max(4000).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  conversationId: z.string().trim().min(1).max(200),
  messageId: z.string().trim().min(1).max(200),
  status: z.string().trim().max(60).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Origen; default 'kapso'. Parte de la clave idempotente. */
  source: z.string().trim().min(1).max(60).default('kapso'),
});
export type PedidoInput = z.infer<typeof pedidoSchema>;
