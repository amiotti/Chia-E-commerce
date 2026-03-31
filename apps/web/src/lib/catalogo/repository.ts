import { productoSchema, type Producto, type ProductoFiltro } from "@chia/shared";
import { z } from "zod";
import { requireInstantAdminClient } from "@/lib/instant/server";

type CatalogoDataSource = "instantdb";

export type CatalogoListado = {
  items: Producto[];
  total: number;
  categorias: string[];
  source: CatalogoDataSource;
  filters: ProductoFiltro;
  warnings: string[];
};

const productRowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price_cents: z.number().int().nonnegative(),
  currency: z.string().default("ARS"),
  images: z.array(z.string().url()).nullish().transform((value) => value ?? []),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  tags: z.array(z.string()).nullish().transform((value) => value ?? []),
  active: z.boolean().default(true),
  points_enabled: z.boolean().default(false),
  points_cost: z.number().int().positive().nullable().optional(),
});

function normalizeSearch(value?: string) {
  return value?.trim().toLocaleLowerCase("es-AR").normalize("NFD").replace(/\p{Diacritic}/gu, "") ?? "";
}

function applyFilters(items: Producto[], filters: ProductoFiltro) {
  let filtered = [...items].filter((producto) => producto.activo);
  const categoria = filters.categoria;
  const precioMinCents = filters.precioMinCents;
  const precioMaxCents = filters.precioMaxCents;
  if (categoria) filtered = filtered.filter((producto) => normalizeSearch(producto.categoria) === normalizeSearch(categoria));
  if (typeof precioMinCents === "number") filtered = filtered.filter((producto) => producto.precioCents >= precioMinCents);
  if (typeof precioMaxCents === "number") filtered = filtered.filter((producto) => producto.precioCents <= precioMaxCents);
  if (filters.busqueda) {
    const query = normalizeSearch(filters.busqueda);
    filtered = filtered.filter((producto) => normalizeSearch(producto.nombre).includes(query) || normalizeSearch(producto.descripcion).includes(query) || normalizeSearch(producto.categoria).includes(query) || normalizeSearch(producto.slug).includes(query) || producto.tags.some((tag) => normalizeSearch(tag).includes(query)));
  }
  if (filters.orden === "precio_asc") filtered.sort((a, b) => a.precioCents - b.precioCents);
  if (filters.orden === "precio_desc") filtered.sort((a, b) => b.precioCents - a.precioCents);
  if (filters.orden === "novedades") filtered.sort((a, b) => b.id.localeCompare(a.id));
  return filtered;
}

function categoriasFromItems(items: Producto[]) {
  return [...new Set(items.filter((item) => item.activo).map((item) => item.categoria))].sort((a, b) => a.localeCompare(b, "es-AR"));
}

function mapRow(row: z.infer<typeof productRowSchema>): Producto {
  return productoSchema.parse({
    id: row.id,
    slug: row.slug,
    nombre: row.name,
    descripcion: row.description,
    precioCents: row.price_cents,
    moneda: row.currency,
    imagenes: row.images,
    stock: row.stock,
    categoria: row.category,
    tags: row.tags,
    activo: row.active,
    canjeConPuntos: row.points_enabled,
    puntosCanje: row.points_cost ?? null,
  });
}

async function fetchAllProductosFromInstant(): Promise<Producto[]> {
  const db = requireInstantAdminClient();
  const result = await db.query({ products: {} });
  const rowsParsed = z.array(productRowSchema).safeParse((result as { products?: unknown }).products ?? []);
  if (!rowsParsed.success) throw new Error("InstantDB devolvio filas incompatibles con el schema de productos.");
  return rowsParsed.data.map(mapRow);
}

export async function listCatalogoProductos(filters: ProductoFiltro = {}): Promise<CatalogoListado> {
  const mapped = await fetchAllProductosFromInstant();
  const items = applyFilters(mapped, filters);
  return {
    items,
    total: items.length,
    categorias: categoriasFromItems(mapped),
    source: "instantdb",
    filters,
    warnings: mapped.length === 0 ? ["No hay productos en la entidad products de InstantDB."] : [],
  };
}

export async function getCatalogoProductoBySlug(slug: string): Promise<Producto | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;
  const all = await fetchAllProductosFromInstant();
  return all.find((item) => item.slug === cleanSlug) ?? null;
}
