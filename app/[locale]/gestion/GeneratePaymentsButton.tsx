"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PaymentCandidate = {
  unitId: string;
  code: string;
  amount: number;
};

export default function GeneratePaymentsButton({
  candidates,
  period,
}: {
  candidates: PaymentCandidate[];
  period: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const router = useRouter();

  async function generatePayments() {
    if (!candidates.length) return;
    if (!window.confirm(`¿Generar ${candidates.length} cobro${candidates.length === 1 ? "" : "s"} pendiente${candidates.length === 1 ? "" : "s"} para ${period}?`)) return;
    setState("saving");

    try {
      for (let index = 0; index < candidates.length; index += 8) {
        const batch = candidates.slice(index, index + 8);
        const responses = await Promise.all(batch.map((candidate) => fetch("/api/admin/payments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            unit_id: candidate.unitId,
            period,
            amount: candidate.amount,
            status: "due",
          }),
        })));
        if (responses.some((response) => response.status === 401)) {
          router.replace("/login?redirect=/gestion");
          return;
        }
        if (responses.some((response) => !response.ok)) throw new Error("payment_generation_failed");
      }
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <span className="bulk-payment-action">
      <button type="button" className="secondary-action" disabled={!candidates.length || state === "saving"} onClick={generatePayments}>
        {state === "saving" ? "Generando…" : candidates.length ? `Generar ${candidates.length} cobro${candidates.length === 1 ? "" : "s"}` : "Cartera completa"}
      </button>
      <small className={state === "error" ? "error" : ""} aria-live="polite">
        {state === "done" ? "Cobros actualizados." : state === "error" ? "Hubo un error; podés reintentar sin duplicar cobros." : ""}
      </small>
    </span>
  );
}
