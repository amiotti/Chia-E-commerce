import { NextResponse } from "next/server";
import { parseCatalogoFilters } from "@/lib/catalogo/filtros";
import { listCatalogoProductos } from "@/lib/catalogo/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseCatalogoFilters(Object.fromEntries(searchParams.entries()));
  const resultado = await listCatalogoProductos(filters);

  return NextResponse.json(resultado, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
