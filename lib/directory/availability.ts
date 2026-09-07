import type { PublicUnit } from "@/lib/domain/types";

const COMMERCIAL_FLOORS = [
  { floor: "Planta Baja", shortLabel: "PB" },
  { floor: "Planta Alta", shortLabel: "PA" },
] as const;

export type AvailabilityByFloor = {
  floor: string;
  shortLabel: string;
  total: number;
  available: number;
  codes: string[];
  opportunity: string;
};

export type PublicAvailability = {
  commercialUnitCount: number;
  availableUnitCount: number;
  floors: AvailabilityByFloor[];
  hasData: boolean;
};

function describeOpportunity(floor: string, available: number, total: number) {
  if (total === 0) return "La administración confirmará la disponibilidad.";
  if (available === 0) return "Actualmente no hay vacancias publicadas en este nivel.";

  const percentage = Math.round((available / total) * 100);
  if (floor === "Planta Alta" && percentage >= 50) {
    return `${percentage}% de este nivel está disponible: una oportunidad para sumar nuevos comercios y servicios.`;
  }

  return `${available} ${available === 1 ? "vacancia publicada" : "vacancias publicadas"} en este nivel.`;
}

/**
 * Resume la proyección pública de `units` para la portada. No recibe ni expone
 * información contractual: los conteos y códigos cambian únicamente con el
 * estado real de cada salón en Supabase.
 */
export function summarizePublicAvailability(units: readonly PublicUnit[]): PublicAvailability {
  const floors = COMMERCIAL_FLOORS.map(({ floor, shortLabel }) => {
    const floorUnits = units.filter((unit) => unit.floor === floor);
    const codes = floorUnits
      .filter((unit) => unit.status === "available")
      .map((unit) => unit.code)
      .sort((left, right) => left.localeCompare(right, "es"));

    return {
      floor,
      shortLabel,
      total: floorUnits.length,
      available: codes.length,
      codes,
      opportunity: describeOpportunity(floor, codes.length, floorUnits.length),
    };
  });

  const commercialUnitCount = floors.reduce((total, floor) => total + floor.total, 0);
  const availableUnitCount = floors.reduce((total, floor) => total + floor.available, 0);

  return {
    commercialUnitCount,
    availableUnitCount,
    floors,
    hasData: commercialUnitCount > 0,
  };
}
