"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentButton({ paymentId }: { paymentId: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function markPaid() {
    if (!window.confirm("¿Confirmás que este alquiler fue pagado en efectivo?")) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paid", method: "Efectivo" }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el cobro");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return <span className="payment-action"><button className="payment-button" disabled={saving} onClick={markPaid}>{saving ? "Guardando…" : "Marcar pagado"}</button>{error && <small role="alert">Reintentá</small>}</span>;
}
