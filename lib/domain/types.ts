export const UNIT_STATUSES = [
  "occupied",
  "available",
  "reserved",
  "maintenance",
] as const;

export const PAYMENT_STATUSES = ["paid", "due", "overdue"] as const;

export const INQUIRY_STATUSES = ["new", "contacted", "closed"] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/** Proyección pública: nunca agregar aquí alquiler, vencimiento o teléfono. */
export type PublicUnit = {
  code: string;
  floor: string;
  status: UnitStatus;
  tenant_name: string | null;
  category: string | null;
};

export type AdminPayment = {
  id: string;
  code: string;
  floor: string;
  tenantName: string | null;
  amount: number;
  status: PaymentStatus;
  paidOn: string | null;
};

export type AdminInquiry = {
  id: string;
  kind: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type AdminDashboardData = {
  configured: boolean;
  unitCounts: Record<UnitStatus, number>;
  paymentCounts: Record<PaymentStatus, { total: number; amount: number }>;
  payments: AdminPayment[];
  inquiries: AdminInquiry[];
};
