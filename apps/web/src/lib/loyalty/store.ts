import "server-only";
import type { Producto } from "@chia/shared";
import { z } from "zod";
import type { Order } from "@/lib/commerce/types";
import { listCatalogoProductos } from "@/lib/catalogo/repository";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";
import {
  loyaltyRedemptionSchema,
  loyaltyTransactionSchema,
  loyaltyWalletSchema,
  type LoyaltyRedemption,
  type LoyaltyTransaction,
  type LoyaltyWallet,
} from "./types";

export const LOYALTY_POINTS_EARNING_DIVISOR = 100;

const walletRowSchema = z.object({ user_id: z.string(), balance_points: z.number().int().nonnegative(), lifetime_earned: z.number().int().nonnegative(), lifetime_redeemed: z.number().int().nonnegative(), updated_at: z.string() });
const transactionRowSchema = z.object({ id: z.string(), user_id: z.string(), kind: z.enum(["earn", "redeem", "adjustment", "bonus"]), points: z.number().int().positive(), reason: z.string(), order_id: z.string().nullable().optional(), redemption_id: z.string().nullable().optional(), created_at: z.string() });
const redemptionRowSchema = z.object({ id: z.string(), user_id: z.string(), product_id: z.string(), product_snapshot: z.object({ id: z.string(), slug: z.string(), nombre: z.string(), categoria: z.string(), imagen: z.string().catch(""), currency: z.string().catch("ARS") }), points_cost: z.number().int().positive(), status: z.enum(["SOLICITADO", "ENTREGADO", "CANCELADO"]), created_at: z.string(), updated_at: z.string() });

function mapWallet(row: z.infer<typeof walletRowSchema>): LoyaltyWallet {
  return loyaltyWalletSchema.parse({ userId: row.user_id, balancePoints: row.balance_points, lifetimeEarned: row.lifetime_earned, lifetimeRedeemed: row.lifetime_redeemed, updatedAt: row.updated_at });
}

function mapTransaction(row: z.infer<typeof transactionRowSchema>): LoyaltyTransaction {
  return loyaltyTransactionSchema.parse({ id: row.id, userId: row.user_id, kind: row.kind, points: row.points, reason: row.reason, orderId: row.order_id ?? null, redemptionId: row.redemption_id ?? null, createdAt: row.created_at });
}

function mapRedemption(row: z.infer<typeof redemptionRowSchema>): LoyaltyRedemption {
  return loyaltyRedemptionSchema.parse({ id: row.id, userId: row.user_id, productId: row.product_id, productSnapshot: row.product_snapshot, pointsCost: row.points_cost, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at });
}

function createEmptyWallet(userId: string): LoyaltyWallet {
  return loyaltyWalletSchema.parse({ userId, balancePoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0, updatedAt: new Date(0).toISOString() });
}

export function calculateEarnedPointsForOrder(order: Pick<Order, "shipping" | "itemsSnapshot">) {
  const base = typeof order.shipping?.itemsTotalCents === "number" ? order.shipping.itemsTotalCents : order.itemsSnapshot.reduce((sum, item) => sum + item.subtotalCents, 0);
  return Math.max(0, Math.floor(base / LOYALTY_POINTS_EARNING_DIVISOR));
}

export async function getLoyaltyWallet(userId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { error: ensureError } = await client.rpc("ensure_loyalty_wallet", { p_user_id: userId });
  if (ensureError) throw new Error(`No se pudo inicializar la billetera de puntos: ${ensureError.message}`);
  const { data, error } = await client.from("loyalty_wallets").select("user_id, balance_points, lifetime_earned, lifetime_redeemed, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`No se pudo leer la billetera de puntos: ${error.message}`);
  return data ? mapWallet(walletRowSchema.parse(data)) : createEmptyWallet(userId);
}

export async function listLoyaltyTransactionsByUser(userId: string, limit = 12) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.from("loyalty_transactions").select("id, user_id, kind, points, reason, order_id, redemption_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`No se pudieron leer los movimientos de puntos: ${error.message}`);
  const parsed = z.array(transactionRowSchema).safeParse(data ?? []);
  if (!parsed.success) throw new Error("Los movimientos de puntos tienen un formato inválido.");
  return parsed.data.map(mapTransaction);
}

export async function listLoyaltyRedemptionsByUser(userId: string, limit = 8) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.from("loyalty_redemptions").select("id, user_id, product_id, product_snapshot, points_cost, status, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`No se pudieron leer los canjes realizados: ${error.message}`);
  const parsed = z.array(redemptionRowSchema).safeParse(data ?? []);
  if (!parsed.success) throw new Error("Los canjes de puntos tienen un formato inválido.");
  return parsed.data.map(mapRedemption);
}

export async function listRedeemableProducts(): Promise<Producto[]> {
  const catalog = await listCatalogoProductos({ orden: "novedades" });
  return catalog.items.filter((item) => item.activo && item.canjeConPuntos && Boolean(item.puntosCanje));
}

export async function awardPointsForPaidOrder(orderId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.rpc("award_loyalty_points_for_order", { p_order_id: orderId });
  if (error) throw new Error(`No se pudieron acreditar puntos por la orden ${orderId}: ${error.message}`);
  return Number(data ?? 0);
}

export async function redeemProductWithPoints(userId: string, productId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client.rpc("redeem_loyalty_product", { p_user_id: userId, p_product_id: productId });
  if (error) {
    const message = error.message ?? "No se pudo realizar el canje.";
    if (message.includes("INSUFFICIENT_POINTS")) throw new Error("No tenés puntos suficientes para canjear este producto.");
    if (message.includes("PRODUCT_OUT_OF_STOCK")) throw new Error("Este producto no tiene stock disponible para canje.");
    if (message.includes("PRODUCT_NOT_REDEEMABLE") || message.includes("PRODUCT_POINTS_COST_INVALID")) throw new Error("Este producto no está disponible para canjear con puntos.");
    throw new Error(`No se pudo registrar el canje: ${message}`);
  }
  return z.object({ redemptionId: z.string(), productId: z.string(), productName: z.string(), pointsCost: z.number().int().positive(), balancePoints: z.number().int().nonnegative(), status: z.string() }).parse(data ?? {});
}