import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";

const paramsSchema = z.object({ id: z.string().uuid() });

const paymentUpdateSchema = z.object({
  status: z.enum(["paid", "due", "overdue"]).optional(),
  paid_on: z.string().date().nullable().optional(),
  method: z.string().trim().min(1).max(80).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "Debés enviar al menos un cambio.");

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ ok: false, error: "invalid_payment_id" }, { status: 422 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsedBody = paymentUpdateSchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", issues: parsedBody.error.issues },
      { status: 422 },
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }

  const changes = { ...parsedBody.data };
  if (changes.status === "paid" && changes.paid_on === undefined) {
    changes.paid_on = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("payments")
    .update(changes)
    .eq("id", parsedParams.data.id)
    .select("id,status,paid_on,method")
    .maybeSingle();

  if (error) {
    console.error("[admin-payments] No se pudo actualizar el cobro:", error.message);
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "payment_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, payment: data });
}
