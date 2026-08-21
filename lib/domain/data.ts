import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type {
  PublicUnit,
  UnitStatus,
} from "@/lib/domain/types";

function isUnitStatus(value: unknown): value is UnitStatus {
  return ["occupied", "available", "reserved", "maintenance"].includes(String(value));
}

/**
 * Lectura server-side para la portada. La selección es deliberadamente limitada
 * a los campos aprobados por el contrato público.
 */
export async function getPublicUnits(): Promise<PublicUnit[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("units")
    .select("code,floor,status,tenant_name,category")
    .order("code", { ascending: true });

  if (error) {
    console.error("[public-units] No se pudo leer el directorio:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    if (!isUnitStatus(row.status)) return [];
    return [{
      code: String(row.code),
      floor: String(row.floor),
      status: row.status,
      tenant_name: typeof row.tenant_name === "string" ? row.tenant_name : null,
      category: typeof row.category === "string" ? row.category : null,
    } satisfies PublicUnit];
  });
}
