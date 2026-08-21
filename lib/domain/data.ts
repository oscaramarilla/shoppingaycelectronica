import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type {
  AdminDashboardData,
  AdminInquiry,
  AdminPayment,
  PaymentStatus,
  PublicUnit,
  UnitStatus,
} from "@/lib/domain/types";

const emptyUnitCounts: Record<UnitStatus, number> = {
  occupied: 0,
  available: 0,
  reserved: 0,
  maintenance: 0,
};

const emptyPaymentCounts: Record<PaymentStatus, { total: number; amount: number }> = {
  paid: { total: 0, amount: 0 },
  due: { total: 0, amount: 0 },
  overdue: { total: 0, amount: 0 },
};

function isUnitStatus(value: unknown): value is UnitStatus {
  return ["occupied", "available", "reserved", "maintenance"].includes(String(value));
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return ["paid", "due", "overdue"].includes(String(value));
}

/**
 * Lectura server-side para la portada. La selección es deliberadamente limitada
 * a los campos aprobados por el contrato público.
 */
export async function getPublicUnits(): Promise<PublicUnit[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("units")
    .select("code,floor,status,tenant_name,category")
    .order("code", { ascending: true });

  if (error) {
    console.error("[public-units] No se pudo leer el directorio:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    if (!isUnitStatus(row.status)) return [];
    return [{
      code: String(row.code),
      floor: String(row.floor),
      status: row.status,
      tenant_name: typeof row.tenant_name === "string" ? row.tenant_name : null,
      category: typeof row.category === "string" ? row.category : null,
    } satisfies PublicUnit];
  });
}

type PaymentQueryRow = {
  id: unknown;
  amount: unknown;
  status: unknown;
  paid_on: unknown;
  units: { code?: unknown; floor?: unknown; tenant_name?: unknown } | Array<{ code?: unknown; floor?: unknown; tenant_name?: unknown }> | null;
};

/** Lectura administrativa completa, ejecutada únicamente en el servidor. */
export async function getAdminDashboard(period: string): Promise<AdminDashboardData> {
  const supabase = getServiceClient();
  if (!supabase) {
    return {
      configured: false,
      unitCounts: { ...emptyUnitCounts },
      paymentCounts: structuredClone(emptyPaymentCounts),
      payments: [],
      inquiries: [],
    };
  }

  const [unitsResult, paymentsResult, inquiriesResult] = await Promise.all([
    supabase.from("units").select("status"),
    supabase
      .from("payments")
      .select("id,amount,status,paid_on,units!inner(code,floor,tenant_name)")
      .eq("period", period)
      .order("status", { ascending: true })
      .limit(75),
    supabase
      .from("inquiries")
      .select("id,kind,name,phone,created_at")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  for (const [area, error] of [
    ["locales", unitsResult.error],
    ["cobros", paymentsResult.error],
    ["consultas", inquiriesResult.error],
  ] as const) {
    if (error) console.error(`[admin-dashboard] Error leyendo ${area}:`, error.message);
  }

  const unitCounts = { ...emptyUnitCounts };
  for (const row of unitsResult.data ?? []) {
    if (isUnitStatus(row.status)) unitCounts[row.status] += 1;
  }

  const paymentCounts = structuredClone(emptyPaymentCounts);
  const payments: AdminPayment[] = [];
  for (const rawRow of (paymentsResult.data ?? []) as unknown as PaymentQueryRow[]) {
    if (!isPaymentStatus(rawRow.status)) continue;
    const joinedUnit = Array.isArray(rawRow.units) ? rawRow.units[0] : rawRow.units;
    if (!joinedUnit) continue;
    const amount = Number(rawRow.amount);
    paymentCounts[rawRow.status].total += 1;
    paymentCounts[rawRow.status].amount += Number.isFinite(amount) ? amount : 0;
    payments.push({
      id: String(rawRow.id),
      code: String(joinedUnit.code ?? "—"),
      floor: String(joinedUnit.floor ?? ""),
      tenantName: typeof joinedUnit.tenant_name === "string" ? joinedUnit.tenant_name : null,
      amount: Number.isFinite(amount) ? amount : 0,
      status: rawRow.status,
      paidOn: typeof rawRow.paid_on === "string" ? rawRow.paid_on : null,
    });
  }
  const paymentPriority: Record<PaymentStatus, number> = { overdue: 0, due: 1, paid: 2 };
  payments.sort((left, right) => paymentPriority[left.status] - paymentPriority[right.status] || left.code.localeCompare(right.code));

  const inquiries: AdminInquiry[] = (inquiriesResult.data ?? []).map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    name: String(row.name),
    phone: String(row.phone),
    createdAt: String(row.created_at),
  }));

  return { configured: true, unitCounts, paymentCounts, payments, inquiries };
}
