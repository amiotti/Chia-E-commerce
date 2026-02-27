import "server-only";
import { z } from "zod";
import { type CartItem, createOrderRequestSchema, orderSchema, orderStatusSchema, type Order } from "./types";
import { listCatalogoProductos } from "@/lib/catalogo/repository";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function createOrderId(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
  ].join("");
}

function normalizeCartItems(items: CartItem[]) {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.qty);
  }
  return [...byProduct.entries()].map(([productId, qty]) => ({ productId, qty }));
}

function toSupabaseOrderRow(order: Order) {
  return {
    id: order.id,
    user_id: order.userId,
    status: order.status,
    total_cents: order.totalCents,
    currency: order.currency,
    items_snapshot: order.itemsSnapshot,
    shipping: order.shipping,
    created_at: order.createdAt,
    updated_at: new Date().toISOString(),
  };
}

const supabaseOrderRowSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  status: z.string(),
  total_cents: z.number().int().nonnegative(),
  currency: z.string(),
  items_snapshot: z.unknown(),
  shipping: z.unknown(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

function fromSupabaseOrderRow(row: z.infer<typeof supabaseOrderRowSchema>): Order {
  return orderSchema.parse({
    id: row.id,
    userId: row.user_id ?? null,
    status: row.status,
    totalCents: row.total_cents,
    currency: row.currency,
    itemsSnapshot: row.items_snapshot,
    shipping: row.shipping,
    createdAt: row.created_at,
  });
}

export async function createPendingOrder(input: unknown, userId: string | null) {
  const parsed = createOrderRequestSchema.parse(input);
  const normalizedItems = normalizeCartItems(parsed.items);

  const catalog = await listCatalogoProductos({});
  const productsById = new Map(catalog.items.map((item) => [item.id, item]));

  const itemsSnapshot = normalizedItems.map(({ productId, qty }) => {
    const product = productsById.get(productId);
    if (!product) throw new Error(`Producto no encontrado en catálogo: ${productId}`);
    return {
      productId: product.id,
      slug: product.slug,
      nombre: product.nombre,
      precioCents: product.precioCents,
      moneda: product.moneda,
      qty,
      subtotalCents: product.precioCents * qty,
    };
  });

  if (itemsSnapshot.length === 0) throw new Error("No hay items válidos para crear la orden.");

  const itemsTotalCents = itemsSnapshot.reduce((sum, item) => sum + item.subtotalCents, 0);
  const serviceFeeCents = Math.round(itemsTotalCents * 0.05);
  const deliveryFeeCents = parsed.shipping.fulfillmentType === "envio" ? Math.round(itemsTotalCents * 0.05) : 0;
  const totalCents = itemsTotalCents + serviceFeeCents + deliveryFeeCents;

  const order = orderSchema.parse({
    id: createOrderId(),
    userId,
    status: "PENDIENTE_PAGO",
    totalCents,
    currency: "ARS",
    itemsSnapshot,
    shipping: {
      ...parsed.shipping,
      itemsTotalCents,
      serviceFeeCents,
      deliveryFeeCents,
    },
    createdAt: new Date().toISOString(),
  });

  const client = requireSupabaseServiceClient() as any;
  const { error } = await client.from("orders").insert(toSupabaseOrderRow(order));
  if (error) {
    throw new Error(`Error creando orden en Supabase: ${error.message}`);
  }
  return order;
}

export async function getOrderById(id: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("orders")
    .select("id, user_id, status, total_cents, currency, items_snapshot, shipping, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Error leyendo orden en Supabase: ${error.message}`);
  if (!data) return null;
  return fromSupabaseOrderRow(supabaseOrderRowSchema.parse(data));
}

export async function listOrdersByUser(userId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("orders")
    .select("id, user_id, status, total_cents, currency, items_snapshot, shipping, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Error listando órdenes en Supabase: ${error.message}`);
  const parsed = z.array(supabaseOrderRowSchema).safeParse(data ?? []);
  if (!parsed.success) throw new Error("Las órdenes en Supabase tienen formato inválido.");
  return parsed.data.map(fromSupabaseOrderRow);
}

export async function updateOrderStatus(id: string, status: z.infer<typeof orderStatusSchema>) {
  const nextStatus = orderStatusSchema.parse(status);
  const client = requireSupabaseServiceClient() as any;

  const { error } = await client
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Error actualizando estado de orden en Supabase: ${error.message}`);
  return getOrderById(id);
}