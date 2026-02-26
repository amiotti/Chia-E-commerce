import { NextResponse } from "next/server";
import { getCatalogoProductoBySlug } from "@/lib/catalogo/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const producto = await getCatalogoProductoBySlug(slug);

  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }

  return NextResponse.json(
    { producto },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
