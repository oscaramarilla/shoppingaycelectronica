import { describe, expect, it } from "vitest";
import {
  AVAILABLE_UNIT_CODES,
  AVAILABLE_UNIT_COUNT,
  AVAILABLE_UNITS_BY_FLOOR,
  COMMERCIAL_UNIT_COUNT,
} from "@/lib/directory/availability";

describe("datos públicos verificados de la galería", () => {
  it("mantiene 50 salones comerciales y 21 vacancias únicas", () => {
    expect(COMMERCIAL_UNIT_COUNT).toBe(50);
    expect(AVAILABLE_UNIT_COUNT).toBe(21);
    expect(AVAILABLE_UNIT_CODES).toHaveLength(21);
    expect(new Set(AVAILABLE_UNIT_CODES).size).toBe(21);
  });

  it("separa 4 vacancias en PB y 17 en PA", () => {
    expect(AVAILABLE_UNITS_BY_FLOOR.map(({ shortLabel, available }) => [shortLabel, available])).toEqual([
      ["PB", 4],
      ["PA", 17],
    ]);
  });
});
