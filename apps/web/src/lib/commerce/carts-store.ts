import "server-only";
import { z } from "zod";
import { cartItemSchema, cartSnapshotSchema, type CartItem } from "./types";
import { requireInstantAdminClient } from "@/lib/instant/server";

const cartRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  items: z.unknown().optional(),
  updated_at: z.string().optional(),
});

async function readRawCarts() {
  const db = requireInstantAdminClient();
  const result = await db.query({ carts: {} });
  const parsed = z.array(cartRowSchema).safeParse((result as { carts?: unknown }).carts ?? []);
  if (!parsed.success) throw new Error("La entidad carts devolvio filas invalidas en InstantDB.");
  return parsed.data;
}

export async function getCartByUserId(userId: string) {
  const carts = await readRawCarts();
  const data = carts.find((row) => row.user_id === userId);
  if (!data) return null;

  const parsedItems = z.array(cartItemSchema).safeParse(data.items ?? []);
  if (!parsedItems.success) {
    throw new Error("El carrito en InstantDB tiene items invalidos.");
  }

  return cartSnapshotSchema.parse({
    userId: data.user_id,
    items: parsedItems.data,
    updatedAt: data.updated_at ?? new Date().toISOString(),
  });
}

export async function setCartByUserId(userId: string, items: CartItem[]) {
  const safeItems = z.array(cartItemSchema).parse(items).filter((item) => item.qty > 0);
  const db = requireInstantAdminClient();

  const current = await getCartByUserId(userId);
  const cartId = current?.userId ?? userId;

  await db.transact(
    db.tx.carts[cartId].update({
      user_id: userId,
      items: safeItems,
      updated_at: new Date().toISOString(),
    }),
  );

  return getCartByUserId(userId);
}
