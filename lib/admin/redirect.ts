import { routing } from "@/i18n/routing";

const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`);

function isAdminPath(path: string) {
  return path === "/gestion" || path.startsWith("/gestion/") || path === "/admin" || path.startsWith("/admin/");
}

export function normalizeAdminRedirect(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/gestion";
  }
  // Conserva el idioma del intento original: /en/gestion no debe caer a español.
  const prefix = value.match(LOCALE_PREFIX)?.[0] ?? "";
  const path = value.slice(prefix.length) || "/";
  if (isAdminPath(path)) {
    return value;
  }
  return `${prefix}/gestion`;
}
