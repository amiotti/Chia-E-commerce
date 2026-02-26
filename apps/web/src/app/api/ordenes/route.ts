import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createPendingOrder, listOrdersByUser } from "@/lib/commerce/orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const orders = await listOrdersByUser(session.userId);
  return NextResponse.json(
    { ok: true, orders },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    const payload = await request.json();
    const order = await createPendingOrder(payload, session?.userId ?? null);
    return NextResponse.json(
      { ok: true, order },
      { status: 201, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear la orden" },
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}
