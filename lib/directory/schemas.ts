// ============================================================
// SCHEMAS ZOD — endpoints públicos del directorio.
// ============================================================

import { z } from 'zod';

export const UNIT_STATUSES = ['occupied', 'available', 'reserved', 'maintenance'] as const;

/** Query params de GET /api/units (todos opcionales). */
export const unitsQuerySchema = z.object({
  floor: z.string().trim().min(1).max(50).optional(),
  status: z.enum(UNIT_STATUSES).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
export type UnitsQuery = z.infer<typeof unitsQuerySchema>;

export const INQUIRY_KINDS = ['alquiler', 'producto', 'comerciante'] as const;

/** Body de POST /api/inquiries. */
export const inquirySchema = z.object({
  kind: z.enum(INQUIRY_KINDS),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(30),
  message: z.string().trim().min(1).max(4000),
});
export type InquiryInput = z.infer<typeof inquirySchema>;
