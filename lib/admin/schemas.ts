// ============================================================
// SCHEMAS ZOD — mutaciones del panel de administración.
// ============================================================

import { z } from 'zod';
import { UNIT_STATUSES } from '@/lib/directory/schemas';

export const PAYMENT_STATUSES = ['paid', 'due', 'overdue'] as const;
export const INQUIRY_STATUSES = ['new', 'contacted', 'closed'] as const;

// ── units ────────────────────────────────────────────────────
export const unitCreateSchema = z.object({
  code: z.string().trim().min(1).max(50),
  floor: z.string().trim().min(1).max(50),
  status: z.enum(UNIT_STATUSES),
  tenant_name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  category: z.string().trim().max(100).optional(),
  monthly_rent: z.number().int().min(0).optional(),
  expensa: z.number().int().min(0).optional(),
  beneficiario: z.enum(['ayc', 'zully']).optional(),
  canal_alquiler: z.enum(['directo', 'propisur']).nullable().optional(),
  due_day: z.number().int().min(1).max(31).optional(),
});
export const unitUpdateSchema = unitCreateSchema.partial();

// ── payments ─────────────────────────────────────────────────
export const paymentUpsertSchema = z.object({
  unit_id: z.string().uuid(),
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Formato esperado YYYY-MM'),
  amount: z.number().int().min(0),
  status: z.enum(PAYMENT_STATUSES),
});
export const paymentUpdateSchema = z
  .object({
    status: z.enum(PAYMENT_STATUSES).optional(),
    paid_on: z.string().trim().max(30).optional(),
    method: z.string().trim().max(60).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar.' });

// ── inquiries ────────────────────────────────────────────────
export const inquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
});
