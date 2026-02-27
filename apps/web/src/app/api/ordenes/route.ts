import { NextResponse } from "next/server";
import { createPendingOrder, listOrdersByUser } from "@/lib/commerce/orders-store";
import { requireAuthApi } from "@/lib/auth/guards";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;

  const orders = await listOrdersByUser(auth.session.userId);
  return NextResponse.json(
    { ok: true, orders },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;

  const limited = rateLimit(request, { namespace: "ordenes:create", limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const order = await createPendingOrder(payload, auth.session.userId);
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