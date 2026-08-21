export function normalizeAdminRedirect(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/gestion";
  }
  if (value === "/gestion" || value.startsWith("/gestion/") || value === "/admin" || value.startsWith("/admin/")) {
    return value;
  }
  return "/gestion";
}
