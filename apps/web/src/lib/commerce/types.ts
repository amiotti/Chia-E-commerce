import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
});

export const cartSnapshotSchema = z.object({
  userId: z.string(),
  items: z.array(cartItemSchema),
  updatedAt: z.string(),
});

export const orderStatusSchema = z.enum([
  "CREADA",
  "PENDIENTE_PAGO",
  "PAGADA",
  "CANCELADA",
  "REEMBOLSADA",
]);

export const orderItemSnapshotSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  nombre: z.string(),
  precioCents: z.number().int().nonnegative(),
  moneda: z.string(),
  qty: z.number().int().positive(),
  subtotalCents: z.number().int().nonnegative(),
});

export const fulfillmentTypeSchema = z.enum(["envio", "retiro_local"]);

export const orderShippingSchema = z.object({
  fulfillmentType: fulfillmentTypeSchema.default("envio"),
  nombreCompleto: z.string(),
  email: z.email(),
  telefono: z.string().optional().default(""),
  direccion: z.string().optional().default(""),
  ciudad: z.string().optional().default(""),
  provincia: z.string().optional().default(""),
  codigoPostal: z.string().optional().default(""),
  notas: z.string().optional().default(""),
  itemsTotalCents: z.number().int().nonnegative().optional().default(0),
  serviceFeeCents: z.number().int().nonnegative().optional().default(0),
  deliveryFeeCents: z.number().int().nonnegative().optional().default(0),
});

export const orderSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  status: orderStatusSchema,
  totalCents: z.number().int().nonnegative(),
  currency: z.string().default("ARS"),
  itemsSnapshot: z.array(orderItemSnapshotSchema),
  shipping: orderShippingSchema,
  createdAt: z.string(),
});

export const createOrderRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
  shipping: orderShippingSchema,
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type CartSnapshot = z.infer<typeof cartSnapshotSchema>;
export type FulfillmentType = z.infer<typeof fulfillmentTypeSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;