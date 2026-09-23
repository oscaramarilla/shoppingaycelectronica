// ============================================================
// Routing i18n — idiomas soportados.
// `as-needed`: el español (default) vive sin prefijo (/categorias),
// el resto sí lo lleva (/en/categorias, /pt/categorias).
//
// Este módulo se mantiene libre de dependencias de React/Next para
// poder importarse desde el proxy, desde `lib/` y desde los tests.
// La navegación con locale vive en `i18n/navigation.ts`.
// ============================================================

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
