import "server-only";
import { productoCreateSchema, productoSchema, productoUpdateSchema, type Producto } from "@chia/shared";
import { z } from "zod";
import { requireInstantAdminClient } from "@/lib/instant/server";

const productRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price_cents: z.number().int().nonnegative(),
  currency: z.string(),
  images: z.array(z.string().url()).nullish().transform((value) => value ?? []),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  tags: z.array(z.string()).nullish().transform((value) => value ?? []),
  active: z.boolean(),
  points_enabled: z.boolean().default(false),
  points_cost: z.number().int().positive().nullable().optional(),
});

function createAdminProductId() {
  return `adm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toRow(producto: Producto) {
  return {
    slug: producto.slug,
    name: producto.nombre,
    description: producto.descripcion,
    price_cents: producto.precioCents,
    currency: producto.moneda,
    images: producto.imagenes,
    stock: producto.stock,
    category: producto.categoria,
    tags: producto.tags,
    active: producto.activo,
    points_enabled: producto.canjeConPuntos,
    points_cost: producto.canjeConPuntos ? producto.puntosCanje : null,
  };
}

function fromRow(row: z.infer<typeof productRowSchema>): Producto {
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

function isManagedAdminProductId(id: string) {
  return id.startsWith("adm_") || id.startsWith("imp_");
}

async function readRawProducts() {
  const db = requireInstantAdminClient();
  const result = await db.query({ products: {} });
  const parsed = z.array(productRowSchema).safeParse((result as { products?: unknown }).products ?? []);
  if (!parsed.success) throw new Error("La entidad products devolvio filas incompatibles con el schema esperado.");
  return parsed.data;
}

async function getProductoById(id: string) {
  const rows = await readRawProducts();
  const found = rows.find((row) => row.id === id);
  if (!found) throw new Error("Producto no encontrado.");
  return fromRow(found);
}

export async function readAdminProductos(): Promise<Producto[]> {
  const rows = await readRawProducts();
  return rows.map(fromRow).sort((a, b) => a.slug.localeCompare(b.slug, "es-AR"));
}

export async function createManualAdminProducto(input: unknown): Promise<Producto> {
  const parsed = productoCreateSchema.parse(input);
  const db = requireInstantAdminClient();
  const rows = await readRawProducts();
  const existing = rows.find((row) => row.slug === parsed.slug);
  const productId = existing?.id ?? createAdminProductId();

  const producto = productoSchema.parse({ id: productId, ...parsed });
  await db.transact(db.tx.products[productId].update(toRow(producto)));
  return producto;
}

export async function updateAdminProducto(input: unknown): Promise<Producto> {
  const parsed = productoUpdateSchema.parse(input);
  const current = await getProductoById(parsed.id);
  const producto = productoSchema.parse({
    id: parsed.id,
    slug: parsed.slug ?? current.slug,
    nombre: parsed.nombre ?? current.nombre,
    descripcion: parsed.descripcion ?? current.descripcion,
    precioCents: parsed.precioCents ?? current.precioCents,
    moneda: parsed.moneda ?? current.moneda,
    imagenes: parsed.imagenes ?? current.imagenes,
    stock: parsed.stock ?? current.stock,
    categoria: parsed.categoria ?? current.categoria,
    tags: parsed.tags ?? current.tags,
    activo: parsed.activo ?? current.activo,
    canjeConPuntos: parsed.canjeConPuntos ?? current.canjeConPuntos,
    puntosCanje: parsed.puntosCanje ?? current.puntosCanje,
  });

  const db = requireInstantAdminClient();
  await db.transact(db.tx.products[parsed.id].update(toRow(producto)));
  return producto;
}

export type ImportMode = "merge" | "replace";

export async function importAdminProductos(items: Producto[], mode: ImportMode) {
  const db = requireInstantAdminClient();

  if (mode === "replace") {
    const existing = await readRawProducts();
    const idsToDelete = existing.map((row) => row.id).filter((id) => id && isManagedAdminProductId(id));
    if (idsToDelete.length > 0) {
      await db.transact(idsToDelete.map((id) => db.tx.products[id].delete()));
    }
  }

  if (items.length > 0) {
    await db.transact(items.map((item) => db.tx.products[item.id].update(toRow(item))));
  }

  const totalAfter = (await readAdminProductos()).length;
  return {
    mode,
    importedCount: items.length,
    totalAfter,
    slugs: items.map((item) => item.slug),
    persistedInInstantDB: true,
  };
}
