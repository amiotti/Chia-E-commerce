import "server-only";
import { productoCreateSchema, productoSchema, productoUpdateSchema, type Producto } from "@chia/shared";
import { z } from "zod";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";

const PRODUCT_SELECT = "id, slug, name, description, price_cents, currency, images, stock, category, tags, active, points_enabled, points_cost";

const supabaseProductRowSchema = z.object({
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

function toSupabaseProductRow(producto: Producto) {
  return {
    id: producto.id,
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

function fromSupabaseProductRow(row: z.infer<typeof supabaseProductRowSchema>): Producto {
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

async function getProductoById(id: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer el producto ${id} desde Supabase: ${error.message}`);
  if (!data) throw new Error("Producto no encontrado.");
  return fromSupabaseProductRow(supabaseProductRowSchema.parse(data));
}

export async function readAdminProductos(): Promise<Producto[]> {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.from("products").select(PRODUCT_SELECT).order("slug", { ascending: true });
  if (error) throw new Error(`Error leyendo productos desde Supabase: ${error.message}`);
  const parsed = z.array(supabaseProductRowSchema).safeParse(data ?? []);
  if (!parsed.success) throw new Error("La tabla products devolvió filas incompatibles con el schema esperado.");
  return parsed.data.map(fromSupabaseProductRow);
}

export async function createManualAdminProducto(input: unknown): Promise<Producto> {
  const parsed = productoCreateSchema.parse(input);
  const producto = productoSchema.parse({ id: createAdminProductId(), ...parsed });
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("products")
    .upsert(toSupabaseProductRow(producto), { onConflict: "slug" })
    .select(PRODUCT_SELECT)
    .single();
  if (error) throw new Error(`No se pudo guardar el producto en Supabase: ${error.message}`);
  return fromSupabaseProductRow(supabaseProductRowSchema.parse(data));
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

  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("products")
    .update(toSupabaseProductRow(producto))
    .eq("id", parsed.id)
    .select(PRODUCT_SELECT)
    .single();
  if (error) throw new Error(`No se pudo actualizar el producto en Supabase: ${error.message}`);
  return fromSupabaseProductRow(supabaseProductRowSchema.parse(data));
}

export type ImportMode = "merge" | "replace";

export async function importAdminProductos(items: Producto[], mode: ImportMode) {
  const client = requireSupabaseServiceClient() as any;
  if (mode === "replace") {
    const { data: idsData, error: idsError } = await client.from("products").select("id");
    if (idsError) throw new Error(`No se pudieron leer IDs de products para replace: ${idsError.message}`);
    const idsToDelete = (idsData ?? [])
      .map((row: unknown) => String((row as { id?: string }).id ?? ""))
      .filter((id: string) => id && isManagedAdminProductId(id));
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await client.from("products").delete().in("id", idsToDelete);
      if (deleteError) throw new Error(`No se pudieron borrar productos administrados en replace: ${deleteError.message}`);
    }
  }
  if (items.length > 0) {
    const rows = items.map(toSupabaseProductRow);
    const { error: upsertError } = await client.from("products").upsert(rows, { onConflict: "slug" });
    if (upsertError) throw new Error(`No se pudieron importar productos a Supabase: ${upsertError.message}`);
  }
  const totalAfter = (await readAdminProductos()).length;
  return { mode, importedCount: items.length, totalAfter, slugs: items.map((item) => item.slug), persistedInSupabase: true };
}