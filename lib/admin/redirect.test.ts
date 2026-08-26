import { describe, expect, it } from "vitest";
import { normalizeAdminRedirect } from "@/lib/admin/redirect";

describe("normalizeAdminRedirect", () => {
  it("acepta rutas administrativas internas", () => {
    expect(normalizeAdminRedirect("/gestion")).toBe("/gestion");
    expect(normalizeAdminRedirect("/admin/locales")).toBe("/admin/locales");
  });

  it("bloquea redirecciones abiertas o públicas", () => {
    expect(normalizeAdminRedirect("https://evil.example")).toBe("/gestion");
    expect(normalizeAdminRedirect("//evil.example")).toBe("/gestion");
    expect(normalizeAdminRedirect("/productos")).toBe("/gestion");
  });
});
