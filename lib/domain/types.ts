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
  category: string | null;
};

export type RentalBeneficiary = "ayc" | "zully";
export type RentalChannel = "directo" | "propisur" | null;

export type AdminUnit = {
  id: string;
  code: string;
  floor: string;
  status: UnitStatus;
  tenantName: string | null;
  phone: string | null;
  category: string | null;
  monthlyRent: number;
  expensa: number;
  beneficiary: RentalBeneficiary;
  rentalChannel: RentalChannel;
  dueDay: number;
};

export type AdminPayment = {
  id: string;
  unitId: string;
  code: string;
  floor: string;
  tenantName: string | null;
  amount: number;
  monthlyRent: number;
  expensa: number;
  beneficiary: RentalBeneficiary;
  rentalChannel: RentalChannel;
  status: PaymentStatus;
  paidOn: string | null;
};

export type AdminInquiry = {
  id: string;
  kind: string;
  name: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export type AdminDashboardData = {
  units: AdminUnit[];
  unitCounts: Record<UnitStatus, number>;
  zullyPaymentCounts: Record<PaymentStatus, { total: number; amount: number }>;
  paymentCounts: Record<PaymentStatus, { total: number; amount: number }>;
  payments: AdminPayment[];
  inquiries: AdminInquiry[];
};
