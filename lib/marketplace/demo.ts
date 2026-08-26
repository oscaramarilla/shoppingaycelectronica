export type MarketplaceOffer = {
  name: string;
  kind: "product" | "service";
  description: string;
  priceLabel: string;
};

export type MarketplaceProfile = {
  slug: string;
  unitCode: string;
  floor: string;
  name: string;
  category: string;
  summary: string;
  specialties: string[];
  hours: string;
  locationHint: string;
  publicWhatsapp: string | null;
  offers: MarketplaceOffer[];
  isDemo: true;
};

/**
 * Datos exclusivamente visuales para revisar el marketplace antes de importar
 * comercios reales. Nunca se mezclan con alquileres ni datos privados.
 */
export const demoProfiles: MarketplaceProfile[] = [
  {
    slug: "punto-movil-demo",
    unitCode: "PB-DEMO",
    floor: "Planta baja",
    name: "Punto Móvil Demo",
    category: "Celulares",
    summary: "Ejemplo de una ficha para venta de accesorios y soluciones móviles.",
    specialties: ["Accesorios", "Cargadores", "Protección"],
    hours: "Horario de muestra",
    locationHint: "Planta baja · ubicación ilustrativa",
    publicWhatsapp: null,
    offers: [
      {
        name: "Cargadores y cables",
        kind: "product",
        description: "Opciones para diferentes marcas y modelos.",
        priceLabel: "Desde Gs. 45.000 · ilustrativo",
      },
      {
        name: "Fundas y protección",
        kind: "product",
        description: "Fundas, vidrios y accesorios de protección.",
        priceLabel: "Consultar · demostración",
      },
    ],
    isDemo: true,
  },
  {
    slug: "tecnofix-demo",
    unitCode: "1P-DEMO",
    floor: "Primer piso",
    name: "TecnoFix Demo",
    category: "Servicio técnico",
    summary: "Ejemplo de una ficha para diagnóstico y reparación de equipos.",
    specialties: ["Celulares", "Notebooks", "Diagnóstico"],
    hours: "Horario de muestra",
    locationHint: "Primer piso · ubicación ilustrativa",
    publicWhatsapp: null,
    offers: [
      {
        name: "Diagnóstico técnico",
        kind: "service",
        description: "Revisión inicial del equipo y orientación sobre la reparación.",
        priceLabel: "Precio a confirmar",
      },
      {
        name: "Cambio de pantalla",
        kind: "service",
        description: "Servicio demostrativo; el precio real depende del modelo.",
        priceLabel: "Desde Gs. 180.000 · ilustrativo",
      },
    ],
    isDemo: true,
  },
  {
    slug: "conecta-pro-demo",
    unitCode: "2P-DEMO",
    floor: "Segundo piso",
    name: "Conecta Pro Demo",
    category: "Electrónica",
    summary: "Ejemplo de una ficha para redes, cámaras y conectividad empresarial.",
    specialties: ["CCTV", "Redes", "Conectividad"],
    hours: "Horario de muestra",
    locationHint: "Segundo piso · ubicación ilustrativa",
    publicWhatsapp: null,
    offers: [
      {
        name: "Kit de cámaras",
        kind: "product",
        description: "Configuración según cantidad de puntos y características del lugar.",
        priceLabel: "Cotización personalizada",
      },
      {
        name: "Instalación de red",
        kind: "service",
        description: "Diseño e instalación para hogares, oficinas y comercios.",
        priceLabel: "Cotización personalizada",
      },
    ],
    isDemo: true,
  },
];

export function getDemoProfile(slug: string) {
  return demoProfiles.find((profile) => profile.slug === slug) ?? null;
}
