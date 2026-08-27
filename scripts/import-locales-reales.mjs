import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const csvPath = path.resolve("docs/data/locales-reales.csv");
const dryRun = process.argv.includes("--dry-run");

try {
  await fs.access(".env.local");
  if (typeof process.loadEnvFile === "function") process.loadEnvFile(".env.local");
} catch {
  // Vercel/CI normalmente inyectan las variables directamente.
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function integerOrZero(value, field, code) {
  if (!value) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${field} inválido en ${code}`);
  return parsed;
}

function nullableInteger(value, field, code) {
  if (!value) return null;
  return integerOrZero(value, field, code);
}

const csv = await fs.readFile(csvPath, "utf8");
const [headers, ...sourceRows] = parseCsv(csv.replace(/^\uFEFF/, ""));
const expectedHeaders = [
  "unit_code", "floor", "status", "tenant_legal_name", "monthly_rent_pyg",
  "expensa_pyg", "beneficiario", "canal_alquiler", "notas",
];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error("Los encabezados de locales-reales.csv no coinciden con el contrato aprobado.");
}

const source = sourceRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
if (source.length !== 50) throw new Error(`Se esperaban 50 salones; el CSV contiene ${source.length}.`);
if (source.filter((row) => row.status === "available").length !== 21) {
  throw new Error("El CSV no contiene las 21 vacancias aprobadas.");
}
if (new Set(source.map((row) => row.unit_code)).size !== source.length) {
  throw new Error("Hay unit_code duplicados en el CSV.");
}

const units = source.map((row) => {
  if (!['occupied', 'available', 'reserved', 'maintenance'].includes(row.status)) {
    throw new Error(`status inválido en ${row.unit_code}`);
  }
  if (!['ayc', 'zully'].includes(row.beneficiario)) {
    throw new Error(`beneficiario inválido en ${row.unit_code}`);
  }
  if (row.canal_alquiler && !['directo', 'propisur'].includes(row.canal_alquiler)) {
    throw new Error(`canal_alquiler inválido en ${row.unit_code}`);
  }
  return {
    code: row.unit_code,
    floor: row.floor,
    status: row.status,
    tenant_name: row.tenant_legal_name || null,
    monthly_rent: integerOrZero(row.monthly_rent_pyg, "monthly_rent_pyg", row.unit_code),
    expensa: nullableInteger(row.expensa_pyg, "expensa_pyg", row.unit_code),
    beneficiario: row.beneficiario,
    canal_alquiler: row.canal_alquiler || null,
  };
});

const availableUnits = units.filter((unit) => unit.status === "available").length;
const zullyUnits = units.filter((unit) => unit.beneficiario === "zully").length;
if (dryRun) {
  console.log(
    `CSV validado sin escribir: ${units.length} salones, ${availableUnits} disponibles, ${zullyUnits} con beneficiario Zully.`,
  );
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. No se modificó la base.");
  process.exit(2);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from("units")
  .upsert(units, { onConflict: "code", ignoreDuplicates: false })
  .select("code,status,beneficiario");

if (error) {
  console.error(`La importación falló: ${error.message}`);
  console.error("Confirmá que docs/sql/units-galeria-fields.sql ya fue ejecutado.");
  process.exit(1);
}

const imported = data ?? [];
const available = imported.filter((unit) => unit.status === "available").length;
const zully = imported.filter((unit) => unit.beneficiario === "zully").length;
if (imported.length !== 50 || available !== 21) {
  throw new Error(`Verificación posterior incompleta: ${imported.length} salones, ${available} disponibles.`);
}

console.log(`Importación verificada: ${imported.length} salones, ${available} disponibles, ${zully} con beneficiario Zully.`);
