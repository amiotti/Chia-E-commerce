import "server-only";
import { randomUUID } from "node:crypto";
import type { Producto } from "@chia/shared";
import { z } from "zod";
import type { Order } from "@/lib/commerce/types";
import { listCatalogoProductos } from "@/lib/catalogo/repository";
import { requireInstantAdminClient } from "@/lib/instant/server";
import {
  loyaltyRedemptionSchema,
  loyaltyTransactionSchema,
  loyaltyWalletSchema,
  type LoyaltyRedemption,
  type LoyaltyTransaction,
  type LoyaltyWallet,
} from "./types";

export const LOYALTY_POINTS_EARNING_DIVISOR = 100;

const walletRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  balance_points: z.number().int().nonnegative(),
  lifetime_earned: z.number().int().nonnegative(),
  lifetime_redeemed: z.number().int().nonnegative(),
  updated_at: z.string(),
});

const transactionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  kind: z.enum(["earn", "redeem", "adjustment", "bonus"]),
  points: z.number().int().positive(),
  reason: z.string(),
  order_id: z.string().nullable().optional(),
  redemption_id: z.string().nullable().optional(),
  created_at: z.string(),
});

const redemptionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  product_id: z.string(),
  product_snapshot: z.object({
    id: z.string(),
    slug: z.string(),
    nombre: z.string(),
    categoria: z.string(),
    imagen: z.string().catch(""),
    currency: z.string().catch("ARS"),
  }),
  points_cost: z.number().int().positive(),
  status: z.enum(["SOLICITADO", "ENTREGADO", "CANCELADO"]),
  created_at: z.string(),
  updated_at: z.string(),
});

const loyaltyAwardRowSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  user_id: z.string(),
  points: z.number().int().nonnegative(),
  created_at: z.string(),
});

const orderRowSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  status: z.string(),
  items_snapshot: z.unknown(),
  shipping: z.unknown(),
});

function mapWallet(row: z.infer<typeof walletRowSchema>): LoyaltyWallet {
  return loyaltyWalletSchema.parse({
    userId: row.user_id,
    balancePoints: row.balance_points,
    lifetimeEarned: row.lifetime_earned,
    lifetimeRedeemed: row.lifetime_redeemed,
    updatedAt: row.updated_at,
  });
}

function mapTransaction(row: z.infer<typeof transactionRowSchema>): LoyaltyTransaction {
  return loyaltyTransactionSchema.parse({
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    points: row.points,
    reason: row.reason,
    orderId: row.order_id ?? null,
    redemptionId: row.redemption_id ?? null,
    createdAt: row.created_at,
  });
}

function mapRedemption(row: z.infer<typeof redemptionRowSchema>): LoyaltyRedemption {
  return loyaltyRedemptionSchema.parse({
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    productSnapshot: row.product_snapshot,
    pointsCost: row.points_cost,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function createEmptyWallet(userId: string): LoyaltyWallet {
  return loyaltyWalletSchema.parse({
    userId,
    balancePoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: new Date(0).toISOString(),
  });
}

export function calculateEarnedPointsForOrder(order: Pick<Order, "shipping" | "itemsSnapshot">) {
  const base = typeof order.shipping?.itemsTotalCents === "number"
    ? order.shipping.itemsTotalCents
    : order.itemsSnapshot.reduce((sum, item) => sum + item.subtotalCents, 0);
  return Math.max(0, Math.floor(base / LOYALTY_POINTS_EARNING_DIVISOR));
}

async function readWallets() {
  const db = requireInstantAdminClient();
  const result = await db.query({ loyalty_wallets: {} });
  const parsed = z.array(walletRowSchema).safeParse((result as { loyalty_wallets?: unknown }).loyalty_wallets ?? []);
  if (!parsed.success) throw new Error("Las billeteras de puntos tienen formato invalido.");
  return parsed.data;
}

async function readTransactions() {
  const db = requireInstantAdminClient();
  const result = await db.query({ loyalty_transactions: {} });
  const parsed = z.array(transactionRowSchema).safeParse((result as { loyalty_transactions?: unknown }).loyalty_transactions ?? []);
  if (!parsed.success) throw new Error("Los movimientos de puntos tienen formato invalido.");
  return parsed.data;
}

async function readRedemptions() {
  const db = requireInstantAdminClient();
  const result = await db.query({ loyalty_redemptions: {} });
  const parsed = z.array(redemptionRowSchema).safeParse((result as { loyalty_redemptions?: unknown }).loyalty_redemptions ?? []);
  if (!parsed.success) throw new Error("Los canjes de puntos tienen formato invalido.");
  return parsed.data;
}

async function readAwards() {
  const db = requireInstantAdminClient();
  const result = await db.query({ loyalty_order_awards: {} });
  const parsed = z.array(loyaltyAwardRowSchema).safeParse((result as { loyalty_order_awards?: unknown }).loyalty_order_awards ?? []);
  if (!parsed.success) throw new Error("Los premios por orden tienen formato invalido.");
  return parsed.data;
}

async function readOrderById(orderId: string) {
  const db = requireInstantAdminClient();
  const result = await db.query({ orders: {} });
  const parsed = z.array(orderRowSchema).safeParse((result as { orders?: unknown }).orders ?? []);
  if (!parsed.success) throw new Error("Las ordenes tienen formato invalido.");
  return parsed.data.find((row) => row.id === orderId) ?? null;
}

async function ensureWallet(userId: string) {
  const wallets = await readWallets();
  const existing = wallets.find((wallet) => wallet.user_id === userId);
  if (existing) return existing;

  const created = {
    id: userId,
    user_id: userId,
    balance_points: 0,
    lifetime_earned: 0,
    lifetime_redeemed: 0,
    updated_at: new Date().toISOString(),
  } satisfies z.infer<typeof walletRowSchema>;

  const db = requireInstantAdminClient();
  await db.transact(
    db.tx.loyalty_wallets[created.id].update({
      user_id: created.user_id,
      balance_points: created.balance_points,
      lifetime_earned: created.lifetime_earned,
      lifetime_redeemed: created.lifetime_redeemed,
      updated_at: created.updated_at,
    }),
  );
  return created;
}

async function updateWalletPoints(userId: string, patch: { deltaBalance: number; deltaEarned?: number; deltaRedeemed?: number }) {
  const wallet = await ensureWallet(userId);
  const next = {
    ...wallet,
    balance_points: Math.max(0, wallet.balance_points + patch.deltaBalance),
    lifetime_earned: Math.max(0, wallet.lifetime_earned + (patch.deltaEarned ?? 0)),
    lifetime_redeemed: Math.max(0, wallet.lifetime_redeemed + (patch.deltaRedeemed ?? 0)),
    updated_at: new Date().toISOString(),
  };

  const db = requireInstantAdminClient();
  await db.transact(
    db.tx.loyalty_wallets[next.id].update({
      user_id: next.user_id,
      balance_points: next.balance_points,
      lifetime_earned: next.lifetime_earned,
      lifetime_redeemed: next.lifetime_redeemed,
      updated_at: next.updated_at,
    }),
  );
  return next;
}

export async function getLoyaltyWallet(userId: string) {
  const wallet = await ensureWallet(userId);
  return wallet ? mapWallet(wallet) : createEmptyWallet(userId);
}

export async function listLoyaltyTransactionsByUser(userId: string, limit = 12) {
  const rows = await readTransactions();
  return rows
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(mapTransaction);
}

export async function listLoyaltyRedemptionsByUser(userId: string, limit = 8) {
  const rows = await readRedemptions();
  return rows
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(mapRedemption);
}

export async function listRedeemableProducts(): Promise<Producto[]> {
  const catalog = await listCatalogoProductos({ orden: "novedades" });
  return catalog.items.filter((item) => item.activo && item.canjeConPuntos && Boolean(item.puntosCanje));
}

export async function awardPointsForPaidOrder(orderId: string) {
  const order = await readOrderById(orderId);
  if (!order || !order.user_id || order.status !== "PAGADA") return 0;

  const awards = await readAwards();
  if (awards.some((entry) => entry.order_id === orderId)) return 0;

  const points = calculateEarnedPointsForOrder({
    shipping: order.shipping as Order["shipping"],
    itemsSnapshot: order.items_snapshot as Order["itemsSnapshot"],
  });
  if (points <= 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const awardId = `award_${orderId}`;
  const txId = randomUUID();
  const db = requireInstantAdminClient();

  await db.transact([
    db.tx.loyalty_order_awards[awardId].update({
      order_id: orderId,
      user_id: order.user_id,
      points,
      created_at: now,
    }),
    db.tx.loyalty_transactions[txId].update({
      user_id: order.user_id,
      kind: "earn",
      points,
      reason: "Puntos acreditados por orden pagada",
      order_id: orderId,
      redemption_id: null,
      created_at: now,
    }),
  ]);

  await updateWalletPoints(order.user_id, { deltaBalance: points, deltaEarned: points });
  return points;
}

export async function redeemProductWithPoints(userId: string, productId: string) {
  const wallet = await ensureWallet(userId);
  const products = await listRedeemableProducts();
  const product = products.find((item) => item.id === productId);

  if (!product || !product.puntosCanje || !product.canjeConPuntos) {
    throw new Error("Este producto no esta disponible para canjear con puntos.");
  }

  if (product.stock <= 0) {
    throw new Error("Este producto no tiene stock disponible para canje.");
  }

  if (wallet.balance_points < product.puntosCanje) {
    throw new Error("No tenes puntos suficientes para canjear este producto.");
  }

  const now = new Date().toISOString();
  const redemptionId = randomUUID();
  const txId = randomUUID();
  const db = requireInstantAdminClient();

  await db.transact([
    db.tx.loyalty_redemptions[redemptionId].update({
      user_id: userId,
      product_id: product.id,
      product_snapshot: {
        id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        categoria: product.categoria,
        imagen: product.imagenes[0] ?? "",
        currency: product.moneda,
      },
      points_cost: product.puntosCanje,
      status: "SOLICITADO",
      created_at: now,
      updated_at: now,
    }),
    db.tx.loyalty_transactions[txId].update({
      user_id: userId,
      kind: "redeem",
      points: product.puntosCanje,
      reason: `Canje de producto: ${product.nombre}`,
      order_id: null,
      redemption_id: redemptionId,
      created_at: now,
    }),
    db.tx.products[product.id].update({ stock: Math.max(0, product.stock - 1) }),
  ]);

  const nextWallet = await updateWalletPoints(userId, {
    deltaBalance: -product.puntosCanje,
    deltaRedeemed: product.puntosCanje,
  });

  return z.object({
    redemptionId: z.string(),
    productId: z.string(),
    productName: z.string(),
    pointsCost: z.number().int().positive(),
    balancePoints: z.number().int().nonnegative(),
    status: z.string(),
  }).parse({
    redemptionId,
    productId: product.id,
    productName: product.nombre,
    pointsCost: product.puntosCanje,
    balancePoints: nextWallet.balance_points,
    status: "SOLICITADO",
  });
}
