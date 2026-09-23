import { describe, expect, it } from "vitest";
import { normalizeAdminRedirect } from "@/lib/admin/redirect";

describe("normalizeAdminRedirect", () => {
  it("acepta rutas administrativas internas", () => {
    expect(normalizeAdminRedirect("/gestion")).toBe("/gestion");
    expect(normalizeAdminRedirect("/admin/locales")).toBe("/admin/locales");
  });

  it("conserva el idioma de la ruta administrativa", () => {
    expect(normalizeAdminRedirect("/en/gestion")).toBe("/en/gestion");
    expect(normalizeAdminRedirect("/pt/admin/locales")).toBe("/pt/admin/locales");
  });

  it("bloquea redirecciones abiertas o públicas", () => {
    expect(normalizeAdminRedirect("https://evil.example")).toBe("/gestion");
    expect(normalizeAdminRedirect("//evil.example")).toBe("/gestion");
    expect(normalizeAdminRedirect("/productos")).toBe("/gestion");
    expect(normalizeAdminRedirect("/engestion")).toBe("/gestion");
  });

  it("cae al panel del mismo idioma cuando la ruta no es administrativa", () => {
    expect(normalizeAdminRedirect("/en/productos")).toBe("/en/gestion");
  });
});
