/**
 * Hechos públicos verificados en el relevamiento de la galería del 2026-08-27.
 * Fuente: docs/data/RELEVAMIENTO-GALERIA.md.
 *
 * No contiene nombres de inquilinos, alquileres ni ningún dato contractual.
 */
export const COMMERCIAL_UNIT_COUNT = 50;
export const AVAILABLE_UNIT_COUNT = 21;

export const AVAILABLE_UNITS_BY_FLOOR = [
  {
    floor: "Planta Baja",
    shortLabel: "PB",
    total: 26,
    available: 4,
    codes: ["PB-11", "PB-16", "PB-19", "PB-26"],
    opportunity: "Pocas vacancias en el nivel de mayor circulación.",
  },
  {
    floor: "Planta Alta",
    shortLabel: "PA",
    total: 24,
    available: 17,
    codes: [
      "PA-31", "PA-32", "PA-33", "PA-34", "PA-35", "PA-36",
      "PA-39", "PA-42", "PA-44", "PA-45", "PA-46", "PA-47",
      "PA-48", "PA-49", "PA-50", "PA-51", "PA-52",
    ],
    opportunity: "Aproximadamente 70% disponible: la gran oportunidad para crecer con el shopping.",
  },
] as const;

export const AVAILABLE_UNIT_CODES = AVAILABLE_UNITS_BY_FLOOR.flatMap(({ codes }) => codes);
