import { z } from "zod";

export const loyaltyWalletSchema = z.object({
  userId: z.string(),
  balancePoints: z.number().int().nonnegative(),
  lifetimeEarned: z.number().int().nonnegative(),
  lifetimeRedeemed: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export const loyaltyTransactionKindSchema = z.enum(["earn", "redeem", "adjustment", "bonus"]);

export const loyaltyTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: loyaltyTransactionKindSchema,
  points: z.number().int().positive(),
  reason: z.string(),
  orderId: z.string().nullable().default(null),
  redemptionId: z.string().nullable().default(null),
  createdAt: z.string(),
});

export const loyaltyRedemptionStatusSchema = z.enum(["SOLICITADO", "ENTREGADO", "CANCELADO"]);

export const loyaltyRedemptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  productSnapshot: z.object({
    id: z.string(),
    slug: z.string(),
    nombre: z.string(),
    categoria: z.string(),
    imagen: z.string().default(""),
    currency: z.string().default("ARS"),
  }),
  pointsCost: z.number().int().positive(),
  status: loyaltyRedemptionStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LoyaltyWallet = z.infer<typeof loyaltyWalletSchema>;
export type LoyaltyTransaction = z.infer<typeof loyaltyTransactionSchema>;
export type LoyaltyRedemption = z.infer<typeof loyaltyRedemptionSchema>;