import { describe, expect, it } from "vitest";
import { summarizePublicAvailability } from "@/lib/directory/availability";
import type { PublicUnit } from "@/lib/domain/types";

const units: PublicUnit[] = [
  { code: "PB-11", floor: "Planta Baja", status: "available", category: null },
  { code: "PB-01", floor: "Planta Baja", status: "occupied", category: "Tecnología" },
  { code: "PA-31", floor: "Planta Alta", status: "available", category: null },
  { code: "PA-32", floor: "Planta Alta", status: "available", category: null },
  { code: "PA-37", floor: "Planta Alta", status: "reserved", category: "Servicio" },
];

describe("resumen público de disponibilidad", () => {
  it("deriva conteos y códigos desde el estado de los salones", () => {
    const availability = summarizePublicAvailability(units);

    expect(availability).toMatchObject({
      commercialUnitCount: 5,
      availableUnitCount: 3,
      hasData: true,
    });
    expect(availability.floors.map(({ shortLabel, total, available, codes }) => ({ shortLabel, total, available, codes }))).toEqual([
      { shortLabel: "PB", total: 2, available: 1, codes: ["PB-11"] },
      { shortLabel: "PA", total: 3, available: 2, codes: ["PA-31", "PA-32"] },
    ]);
  });

  it("no presenta cifras antiguas cuando no hay datos de la base", () => {
    expect(summarizePublicAvailability([])).toMatchObject({
      commercialUnitCount: 0,
      availableUnitCount: 0,
      hasData: false,
    });
  });
});
