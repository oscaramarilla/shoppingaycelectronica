"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InquiryStatusButton({ inquiryId }: { inquiryId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const router = useRouter();

  async function markContacted() {
    setState("saving");
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "contacted" }),
      });
      if (response.status === 401) {
        router.replace("/login?redirect=/gestion");
        return;
      }
      if (!response.ok) throw new Error("inquiry_update_failed");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return <span className="inquiry-action"><button type="button" disabled={state === "saving"} onClick={markContacted}>{state === "saving" ? "Guardando…" : "Marcar contactada"}</button>{state === "error" && <small role="alert">Reintentá</small>}</span>;
}
