import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessOrder, requireAdminApi, requireAuthApi } from "@/lib/auth/guards";
import { getOrderById, updateOrderStatus } from "@/lib/commerce/orders-store";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.literal("PAGADA"),
});

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

export async function PATCH(request: Request, { params }: Props) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;

  const limited = rateLimit(request, { namespace: "ordenes:update-status", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Orden no encontrada" },
      { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const { status } = patchSchema.parse(await request.json());

  if (order.status !== "PENDIENTE_PAGO") {
    return NextResponse.json(
      { ok: false, error: "Solo se pueden marcar como pagadas las ordenes pendientes de pago." },
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const updated = await updateOrderStatus(id, status);
  return NextResponse.json(
    { ok: true, order: updated },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}