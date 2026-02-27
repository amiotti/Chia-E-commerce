import { z } from "zod";
import { currencyCodeSchema, nonEmptyTrimmedString, optionalStringArraySchema } from "./common";

export const productoIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^prod_[a-zA-Z0-9_-]+$/),
  z.string().min(1),
]);

const productoBaseShape = {
  id: productoIdSchema,
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  nombre: nonEmptyTrimmedString,
  descripcion: nonEmptyTrimmedString,
  precioCents: z.number().int().nonnegative(),
  moneda: currencyCodeSchema.default("ARS"),
  imagenes: z.array(z.string().url()).default([]),
  stock: z.number().int().nonnegative(),
  categoria: nonEmptyTrimmedString,
  tags: optionalStringArraySchema,
  activo: z.boolean().default(true),
  canjeConPuntos: z.boolean().default(false),
  puntosCanje: z.number().int().positive().nullable().optional().transform((value) => value ?? null),
} satisfies z.ZodRawShape;

function withPointsValidation<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value: z.infer<T>, ctx) => {
    const candidate = value as { canjeConPuntos?: boolean; puntosCanje?: number | null };
    if (candidate.canjeConPuntos && (!candidate.puntosCanje || candidate.puntosCanje <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["puntosCanje"],
        message: "Definí una cantidad de puntos válida para habilitar el canje.",
      });
    }
  });
}

const productoObjectSchema = z.object(productoBaseShape);
const productoCreateObjectSchema = z.object({
  slug: productoBaseShape.slug,
  nombre: productoBaseShape.nombre,
  descripcion: productoBaseShape.descripcion,
  precioCents: productoBaseShape.precioCents,
  moneda: productoBaseShape.moneda,
  imagenes: productoBaseShape.imagenes,
  stock: productoBaseShape.stock,
  categoria: productoBaseShape.categoria,
  tags: productoBaseShape.tags,
  activo: productoBaseShape.activo,
  canjeConPuntos: productoBaseShape.canjeConPuntos,
  puntosCanje: productoBaseShape.puntosCanje,
});

export const productoSchema = withPointsValidation(productoObjectSchema);
export const productoCreateSchema = withPointsValidation(productoCreateObjectSchema);
export const productoUpdateSchema = withPointsValidation(productoCreateObjectSchema.partial().extend({
  id: productoIdSchema,
}));

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