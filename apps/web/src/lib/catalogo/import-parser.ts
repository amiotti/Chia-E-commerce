import "server-only";
import { productoCreateSchema, productoSchema, type Producto } from "@chia/shared";

function createImportedId(index: number) {
  return `imp_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
}

function parseBooleanLike(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["true", "1", "si", "sí", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

function parseStringArrayCell(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[|;,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberCell(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  result.push(current);
  return result.map((cell) => cell.trim());
}

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function getRowValue(row: CsvRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return undefined;
}

function csvRowToProductoInput(row: CsvRow) {
  return {
    slug: getRowValue(row, ["slug"]),
    nombre: getRowValue(row, ["nombre", "name"]),
    descripcion: getRowValue(row, ["descripcion", "descripción", "description"]),
    precioCents: parseNumberCell(getRowValue(row, ["precioCents", "price_cents", "precio_centavos"])),
    moneda: getRowValue(row, ["moneda", "currency"]) || "ARS",
    imagenes: parseStringArrayCell(getRowValue(row, ["imagenes", "imágenes", "images"])),
    stock: parseNumberCell(getRowValue(row, ["stock"])),
    categoria: getRowValue(row, ["categoria", "categoría", "category"]),
    tags: parseStringArrayCell(getRowValue(row, ["tags"])),
    activo: parseBooleanLike(getRowValue(row, ["activo", "active"])) ?? true,
  };
}

function coerceJsonItem(item: unknown) {
  if (typeof item !== "object" || item === null) return item;
  const candidate = item as Record<string, unknown>;
  return {
    slug: candidate.slug,
    nombre: candidate.nombre ?? candidate.name,
    descripcion: candidate.descripcion ?? candidate.description,
    precioCents: candidate.precioCents ?? candidate.price_cents,
    moneda: candidate.moneda ?? candidate.currency ?? "ARS",
    imagenes: candidate.imagenes ?? candidate.images ?? [],
    stock: candidate.stock,
    categoria: candidate.categoria ?? candidate.category,
    tags: candidate.tags ?? [],
    activo: candidate.activo ?? candidate.active ?? true,
  };
}

function normalizeAndValidateItems(items: unknown[]): Producto[] {
  return items.map((item, index) => {
    const parsedCreate = productoCreateSchema.parse(item);
    return productoSchema.parse({
      id: createImportedId(index),
      ...parsedCreate,
    });
  });
}

export function parseProductosImportFile(filename: string, text: string): Producto[] {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".json")) {
    const json = JSON.parse(text);
    if (!Array.isArray(json)) {
      throw new Error("El archivo JSON debe contener un array de productos.");
    }
    return normalizeAndValidateItems(json.map(coerceJsonItem));
  }

  if (lowerName.endsWith(".csv")) {
    const rows = parseCsv(text);
    return normalizeAndValidateItems(rows.map(csvRowToProductoInput));
  }

  throw new Error("Formato no soportado. Usá .json o .csv");
}
