import { NextResponse } from "next/server";
import { canAccessOrder, requireAuthApi } from "@/lib/auth/guards";
import { getOrderById } from "@/lib/commerce/orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || !canAccessOrder(auth.session, order)) {
    return NextResponse.json(
      { ok: false, error: "Orden no encontrada" },
      { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  return NextResponse.json(
    { ok: true, order },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}