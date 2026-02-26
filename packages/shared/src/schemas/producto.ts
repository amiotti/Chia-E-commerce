import { z } from "zod";
import { currencyCodeSchema, nonEmptyTrimmedString, optionalStringArraySchema } from "./common";

export const productoIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^prod_[a-zA-Z0-9_-]+$/),
  z.string().min(1),
]);

export const productoSchema = z.object({
  id: productoIdSchema,
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  nombre: nonEmptyTrimmedString,
  descripcion: nonEmptyTrimmedString,
  precioCents: z.number().int().nonnegative(),
  moneda: currencyCodeSchema.default("ARS"),
  imagenes: z.array(z.string().url()).default([]),
  stock: z.number().int().nonnegative(),
  categoria: nonEmptyTrimmedString,
  tags: optionalStringArraySchema,
  activo: z.boolean().default(true),
});

export const productoCreateSchema = productoSchema.omit({ id: true });

export const productoUpdateSchema = productoCreateSchema.partial().extend({
  id: productoIdSchema,
});

export const productoFiltroSchema = z.object({
  busqueda: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  precioMinCents: z.number().int().nonnegative().optional(),
  precioMaxCents: z.number().int().nonnegative().optional(),
  orden: z.enum(["precio_asc", "precio_desc", "novedades"]).optional(),
});

export type Producto = z.infer<typeof productoSchema>;
export type ProductoCreateInput = z.infer<typeof productoCreateSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
export type ProductoFiltro = z.infer<typeof productoFiltroSchema>;