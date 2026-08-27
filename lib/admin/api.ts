import "server-only";

import { headers } from "next/headers";
import type {
  AdminDashboardData,
  AdminInquiry,
  AdminPayment,
  AdminUnit,
  InquiryStatus,
  PaymentStatus,
  RentalBeneficiary,
  RentalChannel,
  UnitStatus,
} from "@/lib/domain/types";

type JsonRecord = Record<string, unknown>;

const unitStatuses = new Set<UnitStatus>(["occupied", "available", "reserved", "maintenance"]);
const paymentStatuses = new Set<PaymentStatus>(["paid", "due", "overdue"]);
const inquiryStatuses = new Set<InquiryStatus>(["new", "contacted", "closed"]);
const rentalBeneficiaries = new Set<RentalBeneficiary>(["ayc", "zully"]);
const rentalChannels = new Set<Exclude<RentalChannel, null>>(["directo", "propisur"]);

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function getServerOrigin() {
  const candidate = process.env.SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  try {
    return new URL(candidate).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function asRecords(value: unknown, field: string): JsonRecord[] {
  if (!value || typeof value !== "object") throw new AdminApiError("Respuesta administrativa inválida.", 502);
  const rows = (value as JsonRecord)[field];
  if (!Array.isArray(rows)) throw new AdminApiError("Respuesta administrativa incompleta.", 502);
  return rows.filter((row): row is JsonRecord => Boolean(row) && typeof row === "object");
}

async function getAdminRows(path: string, field: string, cookie: string) {
  const response = await fetch(new URL(path, getServerOrigin()), {
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });

  if (response.status === 401) throw new AdminApiError("Sesión vencida.", 401);
  if (!response.ok) throw new AdminApiError(`El servicio administrativo respondió ${response.status}.`, response.status);
  return asRecords(await response.json(), field);
}

function toUnit(row: JsonRecord): AdminUnit | null {
  const status = String(row.status) as UnitStatus;
  if (!unitStatuses.has(status)) return null;
  const monthlyRent = Number(row.monthly_rent);
  const expensa = Number(row.expensa);
  const dueDay = Number(row.due_day);
  const beneficiaryCandidate = String(row.beneficiario ?? "ayc") as RentalBeneficiary;
  const rentalChannelCandidate = row.canal_alquiler == null
    ? null
    : String(row.canal_alquiler) as Exclude<RentalChannel, null>;
  return {
    id: String(row.id),
    code: String(row.code),
    floor: String(row.floor),
    status,
    tenantName: typeof row.tenant_name === "string" ? row.tenant_name : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    category: typeof row.category === "string" ? row.category : null,
    monthlyRent: Number.isFinite(monthlyRent) ? monthlyRent : 0,
    expensa: Number.isFinite(expensa) ? expensa : 0,
    beneficiary: rentalBeneficiaries.has(beneficiaryCandidate) ? beneficiaryCandidate : "ayc",
    rentalChannel: rentalChannelCandidate && rentalChannels.has(rentalChannelCandidate)
      ? rentalChannelCandidate
      : null,
    dueDay: Number.isFinite(dueDay) ? dueDay : 10,
  };
}

function toInquiry(row: JsonRecord): AdminInquiry | null {
  const status = String(row.status) as InquiryStatus;
  if (!inquiryStatuses.has(status)) return null;
  return {
    id: String(row.id),
    kind: String(row.kind),
    name: String(row.name),
    phone: String(row.phone),
    message: String(row.message),
    status,
    createdAt: String(row.created_at),
  };
}

export async function getAdminDashboard(period: string): Promise<AdminDashboardData> {
  const cookie = (await headers()).get("cookie") ?? "";
  const [unitRows, paymentRows, inquiryRows] = await Promise.all([
    getAdminRows("/api/admin/units", "units", cookie),
    getAdminRows(`/api/admin/payments?period=${encodeURIComponent(period)}`, "payments", cookie),
    getAdminRows("/api/admin/inquiries?status=new", "inquiries", cookie),
  ]);

  const units = unitRows.flatMap((row) => {
    const unit = toUnit(row);
    return unit ? [unit] : [];
  });
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));

  const unitCounts: Record<UnitStatus, number> = {
    occupied: 0,
    available: 0,
    reserved: 0,
    maintenance: 0,
  };
  for (const unit of units) unitCounts[unit.status] += 1;

  const paymentCounts: Record<PaymentStatus, { total: number; amount: number }> = {
    paid: { total: 0, amount: 0 },
    due: { total: 0, amount: 0 },
    overdue: { total: 0, amount: 0 },
  };
  const zullyPaymentCounts: Record<PaymentStatus, { total: number; amount: number }> = {
    paid: { total: 0, amount: 0 },
    due: { total: 0, amount: 0 },
    overdue: { total: 0, amount: 0 },
  };
  const payments: AdminPayment[] = [];
  for (const row of paymentRows) {
    const status = String(row.status) as PaymentStatus;
    if (!paymentStatuses.has(status)) continue;
    const unitId = String(row.unit_id);
    const unit = unitsById.get(unitId);
    const amount = Number(row.amount);
    const normalizedAmount = Number.isFinite(amount) ? amount : 0;
    const beneficiary = unit?.beneficiary ?? "ayc";
    const targetCounts = beneficiary === "zully" ? zullyPaymentCounts : paymentCounts;
    targetCounts[status].total += 1;
    targetCounts[status].amount += normalizedAmount;
    payments.push({
      id: String(row.id),
      unitId,
      code: unit?.code ?? "—",
      floor: unit?.floor ?? "",
      tenantName: unit?.tenantName ?? null,
      amount: normalizedAmount,
      monthlyRent: unit?.monthlyRent ?? 0,
      expensa: unit?.expensa ?? 0,
      beneficiary,
      rentalChannel: unit?.rentalChannel ?? null,
      status,
      paidOn: typeof row.paid_on === "string" ? row.paid_on : null,
    });
  }
  const paymentPriority: Record<PaymentStatus, number> = { overdue: 0, due: 1, paid: 2 };
  payments.sort((left, right) => paymentPriority[left.status] - paymentPriority[right.status]
    || left.code.localeCompare(right.code));

  const inquiries = inquiryRows.flatMap((row) => {
    const inquiry = toInquiry(row);
    return inquiry ? [inquiry] : [];
  });

  return { units, unitCounts, paymentCounts, zullyPaymentCounts, payments, inquiries };
}
