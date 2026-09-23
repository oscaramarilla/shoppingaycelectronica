// ============================================================
// Navegación con locale — wrappers de next/link y next/navigation
// que mantienen el idioma activo al movernos entre rutas.
// ============================================================

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
