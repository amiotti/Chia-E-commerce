import "server-only";
import { z } from "zod";
import { type CartItem, createOrderRequestSchema, orderSchema, orderStatusSchema, type Order } from "./types";
import { listCatalogoProductos } from "@/lib/catalogo/repository";
import { awardPointsForPaidOrder } from "@/lib/loyalty/store";
import { requireInstantAdminClient } from "@/lib/instant/server";

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

const orderRowSchema = z.object({
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

function toOrderRow(order: Order) {
  return {
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

function fromOrderRow(row: z.infer<typeof orderRowSchema>): Order {
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

async function readRawOrders() {
  const db = requireInstantAdminClient();
  const result = await db.query({ orders: {} });
  const parsed = z.array(orderRowSchema).safeParse((result as { orders?: unknown }).orders ?? []);
  if (!parsed.success) throw new Error("Las ordenes en InstantDB tienen formato invalido.");
  return parsed.data;
}

export async function createPendingOrder(input: unknown, userId: string | null) {
  const parsed = createOrderRequestSchema.parse(input);
  const normalizedItems = normalizeCartItems(parsed.items);
  const catalog = await listCatalogoProductos({});
  const productsById = new Map(catalog.items.map((item) => [item.id, item]));

  const itemsSnapshot = normalizedItems.map(({ productId, qty }) => {
    const product = productsById.get(productId);
    if (!product) throw new Error(`Producto no encontrado en catalogo: ${productId}`);
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

  if (itemsSnapshot.length === 0) throw new Error("No hay items validos para crear la orden.");

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

  const db = requireInstantAdminClient();
  await db.transact(db.tx.orders[order.id].update(toOrderRow(order)));
  return order;
}

export async function getOrderById(id: string) {
  const rows = await readRawOrders();
  const found = rows.find((row) => row.id === id);
  return found ? fromOrderRow(found) : null;
}

export async function listOrdersByUser(userId: string) {
  const rows = await readRawOrders();
  return rows
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(fromOrderRow);
}

export async function updateOrderStatus(id: string, status: z.infer<typeof orderStatusSchema>) {
  const nextStatus = orderStatusSchema.parse(status);
  const current = await getOrderById(id);
  if (!current) return null;
  if (current.status === nextStatus) return current;

  const db = requireInstantAdminClient();
  await db.transact(
    db.tx.orders[id].update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }),
  );

  if (nextStatus === "PAGADA" && current.status !== "PAGADA") {
    await awardPointsForPaidOrder(id);
  }

  return getOrderById(id);
}

export async function listAllOrders() {
  const rows = await readRawOrders();
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(fromOrderRow);
}
