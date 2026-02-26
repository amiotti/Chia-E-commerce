import { productoFiltroSchema, type ProductoFiltro } from "@chia/shared";

type QueryValue = string | string[] | undefined;

export type CatalogoSearchParams = Record<string, QueryValue>;

function firstQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalInt(value: QueryValue) {
  const raw = firstQueryValue(value);
  if (!raw) return undefined;
  const normalized = raw.trim();
  if (!normalized) return undefined;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseCatalogoFilters(searchParams: CatalogoSearchParams): ProductoFiltro {
  const parsed = productoFiltroSchema.safeParse({
    busqueda: firstQueryValue(searchParams.busqueda),
    categoria: firstQueryValue(searchParams.categoria),
    precioMinCents: parseOptionalInt(searchParams.precioMinCents),
    precioMaxCents: parseOptionalInt(searchParams.precioMaxCents),
    orden: firstQueryValue(searchParams.orden),
  });

  if (!parsed.success) return {};
  return parsed.data;
}

export function toCatalogoQueryString(filters: ProductoFiltro) {
  const params = new URLSearchParams();
  if (filters.busqueda) params.set("busqueda", filters.busqueda);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (typeof filters.precioMinCents === "number") params.set("precioMinCents", String(filters.precioMinCents));
  if (typeof filters.precioMaxCents === "number") params.set("precioMaxCents", String(filters.precioMaxCents));
  if (filters.orden) params.set("orden", filters.orden);
  return params.toString();
}
