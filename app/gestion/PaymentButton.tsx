"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentButton({ paymentId }: { paymentId: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function markPaid() {
    if (!window.confirm("¿Confirmás que este alquiler fue pagado en efectivo?")) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paid", method: "Efectivo" }),
      });
      if (response.status === 401) {
        router.replace("/login?redirect=/gestion");
        return;
      }
      if (!response.ok) throw new Error("No se pudo actualizar el cobro");
      router.refresh();
    } catch {
      setError("No se pudo guardar. Reintentá.");
    } finally {
      setSaving(false);
    }
  }

  return <span className="payment-action"><button type="button" className="payment-button" disabled={saving} onClick={markPaid}>{saving ? "Guardando…" : "Marcar pagado"}</button>{error && <small role="alert">{error}</small>}</span>;
}
