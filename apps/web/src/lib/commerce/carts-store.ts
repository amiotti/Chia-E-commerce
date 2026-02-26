import "server-only";
import { z } from "zod";
import { cartItemSchema, cartSnapshotSchema, type CartItem } from "./types";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";

export async function getCartByUserId(userId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.from("carts").select("user_id, items, updated_at").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(`Error leyendo carrito en Supabase: ${error.message}`);
  }
  if (!data) return null;

  const parsedItems = z.array(cartItemSchema).safeParse((data as { items?: unknown }).items ?? []);
  if (!parsedItems.success) {
    throw new Error("El carrito en Supabase tiene items inválidos.");
  }

  return cartSnapshotSchema.parse({
    userId: String((data as { user_id?: string }).user_id ?? userId),
    items: parsedItems.data,
    updatedAt: String((data as { updated_at?: string }).updated_at ?? new Date().toISOString()),
  });
}

export async function setCartByUserId(userId: string, items: CartItem[]) {
  const safeItems = z.array(cartItemSchema).parse(items).filter((item) => item.qty > 0);
  const client = requireSupabaseServiceClient() as any;

  const payload = {
    user_id: userId,
    items: safeItems,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("carts").upsert(payload, { onConflict: "user_id" });
  if (error) {
    throw new Error(`Error guardando carrito en Supabase: ${error.message}`);
  }

  return getCartByUserId(userId);
}