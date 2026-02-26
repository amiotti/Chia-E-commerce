import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { createManualAdminProducto, readAdminProductos } from "@/lib/catalogo/admin-store";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const manualProductoPayloadSchema = z.object({
  slug: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  precioCents: z.coerce.number().int().nonnegative(),
  moneda: z.string().default("ARS"),
  imagenes: z.array(z.string().url()).default([]),
  stock: z.coerce.number().int().nonnegative(),
  categoria: z.string(),
  tags: z.array(z.string()).default([]),
  activo: z.boolean().default(true),
});

function parseMaybeArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(/[|;,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const limited = rateLimit(request, { namespace: "admin:productos:list", limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    const items = await readAdminProductos();
    return NextResponse.json(
      { items, total: items.length },
      { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al leer productos admin" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}

export async function POST(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;
  const limited = rateLimit(request, { namespace: "admin:productos:create", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = {
        slug: formData.get("slug"),
        nombre: formData.get("nombre"),
        descripcion: formData.get("descripcion"),
        precioCents: formData.get("precioCents"),
        moneda: formData.get("moneda") ?? "ARS",
        imagenes: parseMaybeArray(formData.get("imagenes")),
        stock: formData.get("stock"),
        categoria: formData.get("categoria"),
        tags: parseMaybeArray(formData.get("tags")),
        activo: formData.get("activo") !== "false",
      };
    }

    const parsed = manualProductoPayloadSchema.parse(payload);
    const producto = await createManualAdminProducto(parsed);

    return NextResponse.json(
      { ok: true, producto },
      { status: 201, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear el producto" },
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}
